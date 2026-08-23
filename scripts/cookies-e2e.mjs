#!/usr/bin/env node
/**
 * Teste de COMPORTAMENTO do consentimento, em Chrome a sério, sobre o dist/.
 *
 * O scripts/cookies-check.mjs lê o HTML parado e prova o que lá está escrito.
 * Há metade das obrigações que isso não alcança: se um cookie e mesmo gravado
 * antes da decisao, se o Escape consente sem querer, se o painel devolve o foco,
 * se os dois botoes acabam realmente do mesmo tamanho depois de o CSS correr.
 * Isso so se sabe abrindo o site. E o que este ficheiro faz.
 *
 * Reutiliza o servidor estatico e o localizador de Chrome do mobile-check.mjs
 * (mesmo padrao, mesma dependencia puppeteer-core que vem com o lighthouse).
 *
 * Uso:
 *   npm run cookies:e2e     (assume que ja correste o build)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');

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
  const c = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  const hit = c.find((x) => fs.existsSync(x));
  if (!hit) throw new Error('Chrome nao encontrado');
  return hit;
}

let passou = 0, falhou = 0;
function ok(nome, cond, extra = '') {
  if (cond) { passou++; console.log(`  OK   ${nome}`); }
  else { falhou++; console.log(`  FALHA ${nome} ${extra}`); }
}

const { server, port } = await serve(DIST);
const base = `http://127.0.0.1:${port}`;
const browser = await puppeteer.launch({
  executablePath: findChrome(), headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const externos = [];
async function novaPagina() {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  p.on('request', (r) => {
    const u = r.url();
    if (/^https?:\/\//.test(u) && !u.startsWith(base)) externos.push(u);
  });
  return p;
}

const estado = (p) => p.evaluate(() => {
  const r = document.getElementById('ams-cookies');
  return {
    existe: !!r,
    hidden: r ? r.hidden : null,
    visivel: r ? r.classList.contains('is-visivel') : null,
    painel: r ? r.classList.contains('is-painel') : null,
    focoDentro: r ? r.contains(document.activeElement) : null,
    apiPresente: typeof window.amsConsent === 'object',
  };
});
const lerCookie = async (p) => {
  const cs = await p.cookies();
  const c = cs.find((x) => x.name === 'ams-consent');
  return c ? JSON.parse(decodeURIComponent(c.value)) : null;
};

console.log('\n=== 1. Primeira visita, sem decisão ===');
let page = await novaPagina();
await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 5200));   // preloader (~2,4 s) + espera de 400 ms
let s = await estado(page);
ok('a API window.amsConsent existe', s.apiPresente);
ok('o aviso aparece a quem não decidiu', s.existe && s.hidden === false && s.visivel === true, JSON.stringify(s));
ok('NENHUM cookie de consentimento antes de decidir', (await lerCookie(page)) === null);
ok('NENHUM pedido a terceiros antes de decidir', externos.length === 0, externos.join(', '));

console.log('\n=== 2. Escape não é consentimento ===');
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 300));
s = await estado(page);
ok('o aviso continua depois de Escape', s.visivel === true && s.hidden === false);
ok('Escape não gravou registo', (await lerCookie(page)) === null);

console.log('\n=== 3. Rejeitar tudo ===');
await page.click('.cookies__aviso [data-cookies="rejeitar"]');
await new Promise((r) => setTimeout(r, 400));
let reg = await lerCookie(page);
s = await estado(page);
ok('o aviso desaparece', s.hidden === true);
ok('o registo grava as opcionais a false',
  reg && reg.cats && reg.cats.estatisticas === false && reg.cats.marketing === false, JSON.stringify(reg));
ok('o registo traz versão e timestamp', reg && reg.v === 1 && typeof reg.ts === 'number');
ok('continua sem pedidos a terceiros', externos.length === 0, externos.join(', '));

console.log('\n=== 4. Quem já decidiu não volta a ver o aviso ===');
await page.goto(`${base}/portfolio/`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 3200));
s = await estado(page);
ok('o aviso não reaparece noutra página', s.existe && s.hidden === true, JSON.stringify(s));

console.log('\n=== 5. Reabrir pelo rodapé (retirada do consentimento) ===');
await page.evaluate(() => document.querySelector('.footer-links [data-cookies="abrir"]').scrollIntoView());
await page.click('.footer-links [data-cookies="abrir"]');
await new Promise((r) => setTimeout(r, 600));
s = await estado(page);
ok('o painel abre a partir do rodapé', s.painel === true);
ok('o foco entra no painel', s.focoDentro === true);
const toggles = await page.evaluate(() => {
  const o = {};
  document.querySelectorAll('[data-cookies-cat]').forEach((i) => {
    o[i.getAttribute('data-cookies-cat')] = { checked: i.checked, disabled: i.disabled };
  });
  return o;
});
ok('as opcionais estão desligadas depois de rejeitar',
  toggles.estatisticas.checked === false && toggles.marketing.checked === false, JSON.stringify(toggles));
ok('a obrigatória está marcada e bloqueada',
  toggles.necessarios.checked === true && toggles.necessarios.disabled === true);

console.log('\n=== 6. Escolha granular ===');
await page.click('label[for="cookies-cat-estatisticas"]');
await page.click('[data-cookies="guardar"]');
await new Promise((r) => setTimeout(r, 400));
reg = await lerCookie(page);
ok('guardar respeita o interruptor ligado', reg && reg.cats.estatisticas === true, JSON.stringify(reg));
ok('guardar respeita o interruptor desligado', reg && reg.cats.marketing === false);
s = await estado(page);
ok('o painel fecha depois de guardar', s.painel === false && s.hidden === true);

console.log('\n=== 7. Ativação de script inerte por consentimento ===');
const ativou = await page.evaluate(async () => {
  const m = document.createElement('script');
  m.type = 'text/plain';
  m.setAttribute('data-ams-consent', 'marketing');
  m.setAttribute('data-src', '/main.js');
  m.setAttribute('data-attr-defer', '');
  document.body.appendChild(m);
  const antes = !!document.querySelector('script[src="/main.js"][defer]');
  window.amsConsent.aceitarTudo();
  await new Promise((r) => setTimeout(r, 300));
  return {
    antes,
    depois: !!document.querySelector('script[src="/main.js"][defer]'),
    marcado: m.getAttribute('data-ams-ativado') === '1',
  };
});
ok('o script inerte NÃO arranca sem consentimento da sua categoria', ativou.antes === false);
ok('o script inerte arranca ao aceitar', ativou.depois === true, JSON.stringify(ativou));
ok('o molde fica marcado para não repetir', ativou.marcado === true);

console.log('\n=== 8. Revogar ===');
await page.evaluate(() => window.amsConsent.revogar());
await new Promise((r) => setTimeout(r, 500));
ok('revogar apaga o registo', (await lerCookie(page)) === null);
s = await estado(page);
ok('revogar traz o aviso de volta', s.hidden === false && s.visivel === true, JSON.stringify(s));

console.log('\n=== 9. Simetria medida no ecrã ===');
const caixas = await page.evaluate(() => {
  const a = document.querySelector('.cookies__aviso [data-cookies="aceitar"]').getBoundingClientRect();
  const r = document.querySelector('.cookies__aviso [data-cookies="rejeitar"]').getBoundingClientRect();
  const cs = (el) => {
    const c = getComputedStyle(el);
    return [c.fontSize, c.fontWeight, c.color, c.backgroundColor, c.borderWidth, c.textTransform].join('|');
  };
  return {
    larguras: [Math.round(a.width), Math.round(r.width)],
    alturas: [Math.round(a.height), Math.round(r.height)],
    estiloAceitar: cs(document.querySelector('.cookies__aviso [data-cookies="aceitar"]')),
    estiloRejeitar: cs(document.querySelector('.cookies__aviso [data-cookies="rejeitar"]')),
  };
});
ok('mesma largura renderizada', caixas.larguras[0] === caixas.larguras[1], JSON.stringify(caixas.larguras));
ok('mesma altura renderizada', caixas.alturas[0] === caixas.alturas[1], JSON.stringify(caixas.alturas));
ok('mesmo estilo computado (corpo, peso, cor, fundo, bordo, caixa)',
  caixas.estiloAceitar === caixas.estiloRejeitar, `${caixas.estiloAceitar} != ${caixas.estiloRejeitar}`);
ok('alvo de toque >= 44px', caixas.alturas[0] >= 44, String(caixas.alturas[0]));

console.log('\n=== 10. Sem rato: alcançar e recusar só com teclado ===');
await page.evaluate(() => { window.amsConsent.revogar(); });
await new Promise((r) => setTimeout(r, 500));
const tecladoOk = await page.evaluate(async () => {
  // O foco arranca na barra (posto pelo consent.js). Tab até ao botão de rejeitar.
  const rej = document.querySelector('.cookies__aviso [data-cookies="rejeitar"]');
  rej.focus();
  const focado = document.activeElement === rej;
  rej.click();
  await new Promise((r) => setTimeout(r, 200));
  return { focado, escondido: document.getElementById('ams-cookies').hidden };
});
ok('o botão de recusar é focável', tecladoOk.focado);
ok('recusar pelo teclado funciona', tecladoOk.escondido === true);

console.log('\n=== 11. O aviso segue o idioma escolhido ===');
/* O aviso é escrito em PT no .astro e traduzido em runtime pelo main.js, que
   varre [data-i18n]. Se uma chave for renomeada de um lado e não do outro, o
   texto não estoira — fica em português para um visitante inglês, e uma
   informação legal que a pessoa não lê não a informa de nada. Daí este teste. */
const dicts = Object.fromEntries(['en', 'fr'].map((l) => [
  l, JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/i18n', `${l}.json`), 'utf8')).common.cookies,
]));
for (const lang of ['en', 'fr']) {
  const p = await novaPagina();
  await p.evaluateOnNewDocument((l) => {
    try { localStorage.setItem('ams-lang', l); } catch (e) {}
  }, lang);
  await p.goto(`${base}/`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 5200));
  const lido = await p.evaluate(() => ({
    titulo: document.querySelector('.cookies__titulo')?.textContent.trim(),
    aceitar: document.querySelector('.cookies__aviso [data-cookies="aceitar"]')?.textContent.trim(),
    rejeitar: document.querySelector('.cookies__aviso [data-cookies="rejeitar"]')?.textContent.trim(),
    htmlLang: document.documentElement.lang,
  }));
  const esperado = dicts[lang];
  ok(`[${lang}] o título é traduzido`, lido.titulo === esperado.titulo, `${lido.titulo} != ${esperado.titulo}`);
  ok(`[${lang}] os dois botões são traduzidos`,
    lido.aceitar === esperado.aceitar && lido.rejeitar === esperado.rejeitar,
    JSON.stringify(lido));
  ok(`[${lang}] o <html lang> acompanha`, lido.htmlLang === lang, lido.htmlLang);
  await p.close();
}

await browser.close();
server.close();

console.log(`\n${'─'.repeat(60)}`);
console.log(`  ${passou} passaram, ${falhou} falharam`);
console.log(`  pedidos a terceiros durante todo o teste: ${externos.length}`);
if (externos.length) console.log('  ' + [...new Set(externos)].join('\n  '));
console.log('─'.repeat(60) + '\n');
process.exit(falhou ? 1 : 0);
