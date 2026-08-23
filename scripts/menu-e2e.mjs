/**
 * menu-e2e — comportamento do menu de ecrã inteiro no telemóvel.
 *
 * Testa em Chrome, sobre o dist/ construído, o que não se vê numa captura:
 * o painel abre e fecha, o scroll fica travado enquanto está aberto, o
 * hambúrguer vira X, o painel é opaco e a barra do topo continua legível.
 *
 * Uso: npm run build && node scripts/menu-e2e.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
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
    '/usr/bin/google-chrome', '/usr/bin/chromium',
  ].filter(Boolean);
  const hit = c.find((x) => fs.existsSync(x));
  if (!hit) throw new Error('Chrome nao encontrado. Define CHROME_PATH.');
  return hit;
}

const falhas = [];
let total = 0;
function ok(cond, msg, extra) {
  total++;
  if (!cond) falhas.push(msg + (extra === undefined ? '' : ` — ${JSON.stringify(extra)}`));
}

const { server, port } = await serve(DIST);
const browser = await puppeteer.launch({
  executablePath: findChrome(), headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

/* Espera a página assentar: preloader (até 3,5s) e aviso de cookies. O aviso
   é aceite para sair da frente — o que aqui se testa é o menu. */
async function abrirPagina(rota, { largura = 390, altura = 844 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: largura, height: altura, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(`http://127.0.0.1:${port}${rota}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3800));
  await page.evaluate(() => {
    const b = document.querySelector('[data-cookies="aceitar"]');
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  return page;
}

/* Um arrasto para cima, como quem rola a página com o polegar. */
async function deslizar(page) {
  await page.touchscreen.touchStart(195, 700);
  for (let i = 1; i <= 8; i++) await page.touchscreen.touchMove(195, 700 - i * 70);
  await page.touchscreen.touchEnd();
  await new Promise((r) => setTimeout(r, 400));
}

const estado = (page) => page.evaluate(() => {
  const lista = document.querySelector('.nav__list');
  const toggle = document.querySelector('.nav-toggle');
  const primeiro = document.querySelector('.nav__item .nav__link');
  const cs = getComputedStyle(lista);
  const r = primeiro.getBoundingClientRect();
  const traços = [...document.querySelectorAll('.nav-toggle span')]
    .map((s) => getComputedStyle(s).transform);
  return {
    aberto: document.documentElement.classList.contains('nav-aberto'),
    ariaExpanded: toggle.getAttribute('aria-expanded'),
    visibility: cs.visibility,
    pointerEvents: cs.pointerEvents,
    fundo: cs.backgroundColor,
    clip: cs.clipPath,
    htmlOverflow: getComputedStyle(document.documentElement).overflowY,
    /* O <a> só está no sítio quando o topo dele cai dentro do ecrã: fechado
       está uma linha inteira abaixo da máscara. */
    primeiroTopo: Math.round(r.top),
    primeiroAltura: Math.round(r.height),
    corTexto: getComputedStyle(primeiro).color,
    traços,
    scrollY: Math.round(window.scrollY),
  };
});

// ---------------------------------------------------------------- home
{
  const page = await abrirPagina('/');

  const fechado = await estado(page);
  ok(fechado.visibility === 'hidden', 'painel fechado devia estar visibility:hidden', fechado.visibility);
  ok(fechado.pointerEvents === 'none', 'painel fechado devia ignorar o toque', fechado.pointerEvents);
  ok(fechado.ariaExpanded === 'false', 'aria-expanded devia nascer a false', fechado.ariaExpanded);
  ok(fechado.htmlOverflow !== 'hidden', 'scroll não devia estar travado com o menu fechado', fechado.htmlOverflow);

  await page.click('.nav-toggle');
  await new Promise((r) => setTimeout(r, 1700));   // wipe 1s + cascata até .5s
  const aberto = await estado(page);

  ok(aberto.aberto, 'html devia ganhar a classe nav-aberto');
  ok(aberto.ariaExpanded === 'true', 'aria-expanded devia passar a true', aberto.ariaExpanded);
  ok(aberto.visibility === 'visible', 'painel aberto devia estar visível', aberto.visibility);
  /* `hidden` ou `clip`: com o Lenis a correr quem trava é a regra dele
     (.lenis-stopped{overflow:clip}), que ganha por especificidade; sem Lenis
     é a nossa (html.nav-aberto{overflow:hidden}). O que não pode é ser
     `visible`. Ver a nota no styles.css. */
  ok(['hidden', 'clip'].includes(aberto.htmlOverflow), 'scroll da página devia ficar travado', aberto.htmlOverflow);
  ok(aberto.clip.includes('polygon'), 'painel devia abrir por clip-path', aberto.clip);
  // Opaco: o alpha do fundo do painel tem de ser 1 (o defeito antigo era --dark, a .9).
  ok(/^rgb\(\d+, \d+, \d+\)$/.test(aberto.fundo), 'fundo do painel devia ser opaco', aberto.fundo);
  ok(aberto.primeiroTopo > 0 && aberto.primeiroTopo < 844, 'primeiro item devia estar dentro do ecrã', aberto.primeiroTopo);
  ok(aberto.primeiroAltura >= 44, 'item devia cumprir o alvo de toque de 44px', aberto.primeiroAltura);
  // Hambúrguer em X: dois traços rodados (matrix com b/c != 0) e um fora do sítio.
  const rodados = aberto.traços.filter((t) => {
    const n = (t.match(/matrix\(([^)]+)\)/) || [, ''])[1].split(',').map(Number);
    return n.length === 6 && Math.abs(n[1]) > 0.1;
  }).length;
  ok(rodados === 2, 'dois traços do hambúrguer deviam estar rodados (X)', aberto.traços);

  /* O scroll está mesmo travado? Com GESTO, não com window.scrollBy: um
     `overflow:hidden` na raiz continua a permitir scroll programático — é
     assim que a propriedade funciona — e um teste por scrollBy dava falha
     onde não há defeito nenhum. O que tem de ficar preso é o dedo e a roda. */
  await deslizar(page);
  await page.mouse.wheel({ deltaY: 800 });
  await new Promise((r) => setTimeout(r, 800));
  const depoisDeTentarRolar = await estado(page);
  ok(depoisDeTentarRolar.scrollY === 0, 'a página não devia rolar com o menu aberto', depoisDeTentarRolar.scrollY);

  // Fechar pelo mesmo botão.
  await page.click('.nav-toggle');
  await new Promise((r) => setTimeout(r, 1700));
  const refechado = await estado(page);
  ok(!refechado.aberto, 'o botão devia fechar o menu');
  ok(refechado.visibility === 'hidden', 'painel devia voltar a sair da árvore de foco', refechado.visibility);
  ok(!['hidden', 'clip'].includes(refechado.htmlOverflow), 'o scroll devia ser devolvido ao fechar', refechado.htmlOverflow);

  // E o scroll volta mesmo a funcionar — outra vez com o dedo.
  await deslizar(page);
  await new Promise((r) => setTimeout(r, 900));
  const rolou = await page.evaluate(() => Math.round(window.scrollY));
  ok(rolou > 100, 'a página devia voltar a rolar depois de fechar', rolou);

  // Escape também fecha. (Volta ao topo primeiro: a rolar para baixo a barra
  // esconde-se e o botão deixa de estar no ecrã para ser tocado.)
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 700));
  await page.click('.nav-toggle');
  await new Promise((r) => setTimeout(r, 1400));
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));
  const porEscape = await page.evaluate(() => document.documentElement.classList.contains('nav-aberto'));
  ok(!porEscape, 'Escape devia fechar o menu');

  await page.close();
}

// ---- página rolada: a barra do topo tem de continuar legível sobre o painel
{
  const page = await abrirPagina('/portfolio/');
  await page.evaluate(() => window.scrollTo(0, 900));
  await new Promise((r) => setTimeout(r, 900));
  /* Por evaluate e não por page.click: a rolar para baixo a barra esconde-se
     (site-header--hidden) e o botão sai do ecrã — é justamente o caso que a
     última verificação deste bloco cobre. */
  await page.evaluate(() => document.querySelector('.nav-toggle').click());
  await new Promise((r) => setTimeout(r, 1500));
  const barra = await page.evaluate(() => {
    const h = document.querySelector('.site-header');
    const claro = document.querySelector('.logo__img--light');
    const escuro = document.querySelector('.logo__img--dark');
    return {
      scrolled: h.classList.contains('scrolled'),
      fundo: getComputedStyle(h).backgroundColor,
      logoClaro: getComputedStyle(claro).display,
      logoEscuro: getComputedStyle(escuro).display,
      traço: getComputedStyle(document.querySelector('.nav-toggle span')).backgroundColor,
      escondida: h.classList.contains('site-header--hidden'),
    };
  });
  ok(barra.scrolled, 'a página devia estar rolada (barra em .scrolled)');
  ok(barra.fundo === 'rgba(0, 0, 0, 0)', 'a barra devia ficar transparente sobre o painel', barra.fundo);
  ok(barra.logoClaro === 'block' && barra.logoEscuro === 'none', 'devia mostrar o logótipo claro', barra);
  ok(barra.traço === 'rgb(255, 255, 255)', 'os traços do hambúrguer deviam ficar brancos', barra.traço);
  ok(!barra.escondida, 'a barra não devia estar escondida com o menu aberto');
  await page.close();
}

// ---- navegar por um item do menu fecha-o e devolve o scroll
{
  const page = await abrirPagina('/');
  await page.click('.nav-toggle');
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelector('.nav__item .nav__link').click());
  await new Promise((r) => setTimeout(r, 2500));
  const depois = await page.evaluate(() => ({
    aberto: document.documentElement.classList.contains('nav-aberto'),
    overflow: getComputedStyle(document.documentElement).overflowY,
    rota: location.pathname,
  }));
  ok(!depois.aberto, 'navegar devia fechar o menu', depois);
  ok(depois.overflow !== 'hidden', 'navegar devia devolver o scroll', depois.overflow);
  await page.close();
}

// ---- desktop: nada disto se aplica
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3800));
  const desktop = await page.evaluate(() => ({
    toggle: getComputedStyle(document.querySelector('.nav-toggle')).display,
    lista: getComputedStyle(document.querySelector('.nav__list')).position,
    seta: getComputedStyle(document.querySelector('.nav__link-seta')).display,
    btnIdioma: getComputedStyle(document.querySelector('.lang-switch__btn')).display,
    corpo: getComputedStyle(document.querySelector('.nav__link')).fontSize,
  }));
  ok(desktop.toggle === 'none', 'o hambúrguer não devia aparecer no desktop', desktop.toggle);
  ok(desktop.lista === 'static', 'o nav do desktop devia ficar em fluxo', desktop.lista);
  ok(desktop.seta === 'none', 'a seta diagonal é só do painel', desktop.seta);
  ok(desktop.btnIdioma !== 'none', 'o seletor de idioma do desktop devia continuar lá', desktop.btnIdioma);
  ok(parseFloat(desktop.corpo) < 16, 'o nav do desktop devia manter o corpo pequeno', desktop.corpo);
  await page.close();
}

await browser.close();
server.close();

if (falhas.length) {
  console.error(`\nmenu-e2e: ${falhas.length} de ${total} verificações FALHARAM\n`);
  falhas.forEach((f) => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log(`menu-e2e: ${total} verificações, todas passam.`);
