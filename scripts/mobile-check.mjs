/**
 * mobile-check — auditoria de layout móvel sobre o HTML final (dist/).
 *
 * Corre o site em três larguras de telemóvel reais e falha (exit 1) quando
 * aparece uma regressão face à baseline: transbordo horizontal, alvos de toque
 * abaixo do mínimo, texto abaixo do corpo mínimo legível.
 *
 * Uso:
 *   node scripts/mobile-check.mjs              # audita e compara com a baseline
 *   node scripts/mobile-check.mjs --baseline   # (re)grava a baseline
 *   node scripts/mobile-check.mjs --page=home  # limita a uma página
 *   node scripts/mobile-check.mjs --json       # despeja o relatório cru
 *
 * Precisa de dist/ construído (npm run build) e do Chrome instalado.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');   // reatribuído abaixo se vier --dist=
const BASELINE = path.join(ROOT, 'scripts', 'mobile-baseline.json');

const args = process.argv.slice(2);
const WRITE_BASELINE = args.includes('--baseline');
const AS_JSON = args.includes('--json');
const ONLY = (args.find((a) => a.startsWith('--page=')) || '').split('=')[1] || null;
/* Permite auditar um dist/ que não seja o desta árvore — usado para medir um
   commit antigo a partir de um worktree, sem trocar a árvore de trabalho. */
const DIST_ARG = (args.find((a) => a.startsWith('--dist=')) || '').split('=')[1] || null;

/* ---------- limites ----------
   TAP_MIN 44px é o mínimo da WCAG 2.5.5 e o alvo confortável de dedo.
   TEXT_MIN 13px: abaixo disto o utilizador amplia para ler.
   OVERFLOW_TOL 1px absorve arredondamento sub-pixel do layout. */
const TAP_MIN = 44;
const TEXT_MIN = 13;
const OVERFLOW_TOL = 1;

/* Elementos decorativos que sangram de PROPÓSITO para lá do ecrã e são
   recortados pelo `overflow-x:clip` do <html>. Não contam como transbordo — o
   que conta é a página ganhar barra de scroll horizontal, testado à parte por
   documentElement.scrollWidth. */
const DECORATIVE = [
  '.blob', '.blob-layer',
  '.hero__bg', '.hero__overlay',
  '.team--marquee', '.team__track', '.team__set', '.member',
  '.dslider__track', '.dslider__slide', '.dslider__img', '.dslider__thumbs',
  '.curtain', '.preloader',
];

const PAGES = [
  ['home', '/'],
  ['sobre', '/sobre-nos/'],
  ['portfolio', '/portfolio/'],
  ['equipa', '/equipa/'],
  ['contactos', '/contactos/'],
  ['historico', '/historico/'],
  ['empreend', '/empreendimentos/empreendimento-loures-residencial/'],
];

const VIEWPORTS = [
  ['360', 360, 740],   // Android comum / Galaxy S
  ['390', 390, 844],   // iPhone 12–15
  ['414', 414, 896],   // iPhone Plus/Max
];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

function serve(root) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let file = path.join(root, url);
      try {
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) file = path.join(root, url.replace(/\/$/, '') + '.html');
        if (!fs.existsSync(file)) { res.writeHead(404); return res.end('404'); }
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
      } catch { res.writeHead(500); res.end('500'); }
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const hit = candidates.find((c) => fs.existsSync(c));
  if (!hit) throw new Error('Chrome nao encontrado. Define CHROME_PATH.');
  return hit;
}

/* Roda DENTRO da página — sem fechos sobre o módulo, tudo por argumento. */
function collect({ tapMin, textMin, tol, decorative }) {
  const vw = document.documentElement.clientWidth;
  const out = {
    vw, docScrollW: document.documentElement.scrollWidth, docH: document.body.scrollHeight,
    overflow: [], tap: [], text: [], sections: [],
  };
  const decoSel = decorative.join(',');
  const label = (el) => {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
  };
  const seen = new Set();
  const push = (arr, key, entry) => { if (seen.has(key)) return; seen.add(key); arr.push(entry); };

  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const id = label(el);
    const isDeco = el.closest(decoSel) !== null;

    if (!isDeco && (r.right > vw + tol || r.left < -tol)) {
      push(out.overflow, 'o:' + id, {
        id, left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
      });
    }
    if (!isDeco && el.scrollWidth > el.clientWidth + 2 &&
        !['auto', 'scroll', 'hidden', 'clip'].includes(cs.overflowX)) {
      push(out.overflow, 's:' + id, {
        id, kind: 'conteudo-mais-largo', scrollW: el.scrollWidth, clientW: el.clientWidth,
      });
    }

    const tag = el.tagName.toLowerCase();
    const interactive = ['a', 'button', 'input', 'select', 'textarea'].includes(tag)
      || el.getAttribute('role') === 'button';
    /* Excepção "inline" da WCAG 2.5.5: um alvo embebido numa frase está
       isento do mínimo, porque crescê-lo partiria a entrelinha do parágrafo
       à sua volta. Aplica-se estritamente — o elemento tem de ser `inline`
       E ter texto irmão no mesmo pai, ou seja, estar mesmo dentro de texto
       corrido e não a fazer-se passar por isso. */
    const inlineEmTexto = tag === 'a' && cs.display === 'inline'
      && el.parentElement !== null
      && Array.from(el.parentElement.childNodes)
        .some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (interactive && !inlineEmTexto && cs.pointerEvents !== 'none'
        && (r.height < tapMin || r.width < tapMin)) {
      const txt = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 34);
      push(out.tap, 't:' + id + '|' + txt, { id, txt, w: Math.round(r.width), h: Math.round(r.height) });
    }

    const ownText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
    const size = parseFloat(cs.fontSize);
    if (ownText && size < textMin) {
      push(out.text, 'x:' + id, { id, fs: Number(size.toFixed(2)), txt: el.innerText.trim().slice(0, 34) });
    }
  }

  for (const s of document.querySelectorAll('section, footer.site-footer')) {
    const cs = getComputedStyle(s);
    out.sections.push({
      cls: (typeof s.className === 'string' ? s.className : '').slice(0, 46),
      h: Math.round(s.getBoundingClientRect().height),
      padTop: Math.round(parseFloat(cs.paddingTop)),
      padBottom: Math.round(parseFloat(cs.paddingBottom)),
    });
  }
  return out;
}

const { server, port } = await serve(DIST_ARG ? path.resolve(DIST_ARG) : DIST);
const browser = await puppeteer.launch({
  executablePath: findChrome(), headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const report = {};
const pages = ONLY ? PAGES.filter(([n]) => n === ONLY) : PAGES;

for (const [vpName, w, h] of VIEWPORTS) {
  for (const [name, route] of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle0', timeout: 60000 });
    /* Neutraliza entradas animadas: mede-se o layout assente, não o do meio da
       transição — senão o resultado muda entre corridas. */
    await page.addStyleTag({
      content: '*,*::before,*::after{animation-duration:.001s!important;animation-delay:0s!important;'
        + 'transition-duration:.001s!important;transition-delay:0s!important}',
    });
    /* O aviso de cookies aparece de forma assincrona: espera pelo preloader
       e tem um tecto de 6s (ver public/consent.js). Sem esta espera, umas
       corridas mediam-no e outras nao, e o portao passava a oscilar entre
       PASSA e FALHA sem que o codigo tivesse mudado. Espera-se por ele de
       propósito, em vez de o dispensar: numa primeira visita ele FAZ parte
       do ecra, e os alvos e corpos dele contam como os dos outros. */
    await page.waitForSelector('.cookies.is-visivel', { timeout: 9000 })
      .catch(() => { throw new Error(`aviso de cookies nao apareceu em ${route} @${w}px`); });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 700));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 500));
    });
    report[`${name}@${vpName}`] = await page.evaluate(collect, {
      tapMin: TAP_MIN, textMin: TEXT_MIN, tol: OVERFLOW_TOL, decorative: DECORATIVE,
    });
    await page.close();
  }
}

await browser.close();
server.close();

if (WRITE_BASELINE) {
  const counts = Object.fromEntries(Object.entries(report).map(([k, v]) => [k, {
    overflow: v.overflow.length, tap: v.tap.length, text: v.text.length, docH: v.docH,
  }]));
  fs.writeFileSync(BASELINE, JSON.stringify(counts, null, 2) + '\n');
  console.log(`baseline gravada em scripts/mobile-baseline.json (${Object.keys(counts).length} combinacoes)`);
  process.exit(0);
}

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : null;
const RED = '\u001b[31m';
const GREEN = '\u001b[32m';
const OFF = '\u001b[0m';
let totalOverflow = 0;
let totalTap = 0;
let totalText = 0;
let regressions = 0;

console.log('\n  AUDITORIA MOVEL — dist/');
console.log('  ' + '-'.repeat(74));
for (const key of Object.keys(report)) {
  const v = report[key];
  totalOverflow += v.overflow.length;
  totalTap += v.tap.length;
  totalText += v.text.length;
  const b = baseline ? baseline[key] : null;
  const delta = (now, before) => {
    if (before == null) return '';
    const d = now - before;
    if (d > 0) { regressions += d; return ` ${RED}(+${d})${OFF}`; }
    if (d < 0) return ` ${GREEN}(${d})${OFF}`;
    return '';
  };
  let bar = '';
  if (v.docScrollW > v.vw) { bar = `  ${RED}SCROLL-H${OFF}`; regressions += 1; }
  console.log(
    `  ${key.padEnd(18)} transbordo ${String(v.overflow.length).padStart(3)}${delta(v.overflow.length, b && b.overflow)}`
    + `  toque ${String(v.tap.length).padStart(3)}${delta(v.tap.length, b && b.tap)}`
    + `  texto ${String(v.text.length).padStart(3)}${delta(v.text.length, b && b.text)}`
    + `  altura ${String(v.docH).padStart(5)}px${bar}`,
  );
  for (const o of v.overflow.slice(0, 5)) {
    const detail = o.right != null ? `[${o.left}->${o.right}] vw=${v.vw}` : `${o.scrollW}>${o.clientW}`;
    console.log(`      -> ${o.kind || 'fora do ecra'}: ${o.id} ${detail}`);
  }
}
console.log('  ' + '-'.repeat(74));
console.log(`  totais: transbordo ${totalOverflow} · toque<${TAP_MIN}px ${totalTap} · texto<${TEXT_MIN}px ${totalText}`);

if (!baseline) {
  console.log('\n  sem baseline — corre `npm run mobile:baseline` para gravar.\n');
  process.exit(0);
}
if (regressions > 0) {
  console.log(`\n  ${RED}FALHA: ${regressions} regressao(oes) face a baseline.${OFF}\n`);
  process.exit(1);
}
console.log(`\n  ${GREEN}OK — sem regressoes face a baseline.${OFF}\n`);
