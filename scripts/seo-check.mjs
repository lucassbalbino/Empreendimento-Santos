#!/usr/bin/env node
/**
 * Auditoria de SEO sobre o site JÁ CONSTRUÍDO (dist/).
 *
 * Corre contra o HTML final e não contra o código-fonte de propósito: é o HTML
 * final que o Google vê, e é lá que aparecem os erros que o código não mostra
 * — uma canonical relativa, um og:image que ficou sem domínio, uma página que
 * ganhou um segundo <h1> por causa de um componente.
 *
 * Uso:
 *   npm run seo:check     (assume que já correste o build)
 *   npm run seo           (build + check)
 *
 * Sai com código 1 se houver falhas — serve para CI.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(RAIZ, 'dist');
const seo = JSON.parse(readFileSync(join(RAIZ, 'src/data/seo.json'), 'utf8'));
const DOMINIO = seo.dominio.replace(/\/+$/, '');

/* --------------------------------- limites --------------------------------
   Não são regras do Google — o Google não publica limites de caracteres. São a
   janela em que o título e a descrição cabem inteiros na SERP em vez de serem
   cortados a meio, medida em pixéis e convertida para caracteres. Um título
   cortado perde a palavra-chave que estava no fim. */
const TITULO_MIN = 25;
const TITULO_MAX = 65;
const DESC_MIN = 70;
const DESC_MAX = 165;

const falhas = [];
const avisos = [];
let totalVerificacoes = 0;

function falha(pagina, regra, detalhe) {
  falhas.push({ pagina, regra, detalhe });
}
function aviso(pagina, regra, detalhe) {
  avisos.push({ pagina, regra, detalhe });
}
function verifica(condicao, pagina, regra, detalhe) {
  totalVerificacoes++;
  if (!condicao) falha(pagina, regra, detalhe);
}

/* ------------------------------ recolha de páginas ------------------------ */

function listaFicheiros(dir, filtro, acc = []) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) listaFicheiros(caminho, filtro, acc);
    else if (filtro(nome)) acc.push(caminho);
  }
  return acc;
}

/** dist/portfolio/index.html -> "/portfolio/" */
function rotaDe(ficheiro) {
  const rel = relative(DIST, ficheiro).split(sep).join(posix.sep);
  const semIndex = rel.replace(/index\.html$/, '');
  return '/' + semIndex;
}

if (!existsSync(DIST)) {
  console.error('dist/ não existe. Corre `npm run build` primeiro.');
  process.exit(1);
}

/* HTML que não é página do site e por isso não se audita: o painel do Sveltia
   CMS é uma casca de aplicação de terceiros, está atrás de Disallow no
   robots.txt e não tem — nem deve ter — <title> otimizado nem JSON-LD. */
const FORA_DA_AUDITORIA = [/^\/admin\//];

const ficheiros = listaFicheiros(DIST, (n) => n.endsWith('.html'))
  .filter((f) => !FORA_DA_AUDITORIA.some((re) => re.test(rotaDe(f))));

const paginas = ficheiros.map((f) => {
  const html = readFileSync(f, 'utf8');
  return { ficheiro: f, rota: rotaDe(f), html, $: cheerio.load(html) };
});

/* --------------------------- verificações por página ---------------------- */

const titulos = new Map();
const descricoes = new Map();

for (const pag of paginas) {
  const { $, rota } = pag;
  const noindex = ($('meta[name="robots"]').attr('content') ?? '').includes('noindex');
  pag.noindex = noindex;

  /* 1. <title> único, presente e dentro da janela da SERP. */
  const titulo = $('head > title').text().trim();
  verifica($('head > title').length === 1, rota, 'title-unico',
    `esperado 1 <title>, encontrados ${$('head > title').length}`);
  verifica(titulo.length > 0, rota, 'title-presente', '<title> vazio');
  if (titulo) {
    verifica(titulo.length >= TITULO_MIN && titulo.length <= TITULO_MAX, rota, 'title-tamanho',
      `${titulo.length} caracteres (janela ${TITULO_MIN}–${TITULO_MAX}): "${titulo}"`);
    if (!noindex) {
      if (titulos.has(titulo)) falha(rota, 'title-duplicado', `igual a ${titulos.get(titulo)}: "${titulo}"`);
      else titulos.set(titulo, rota);
    }
  }

  /* 2. meta description única e dentro da janela. */
  const desc = $('head meta[name="description"]').attr('content')?.trim() ?? '';
  verifica(desc.length > 0, rota, 'description-presente', 'sem meta description');
  if (desc) {
    verifica(desc.length >= DESC_MIN && desc.length <= DESC_MAX, rota, 'description-tamanho',
      `${desc.length} caracteres (janela ${DESC_MIN}–${DESC_MAX})`);
    if (!noindex) {
      if (descricoes.has(desc)) falha(rota, 'description-duplicada', `igual a ${descricoes.get(desc)}`);
      else descricoes.set(desc, rota);
    }
  }

  /* 3. canonical absoluta e a apontar para a própria rota.
        As páginas noindex não têm canonical de propósito (ver Seo.astro) — o
        que se verifica aí é o inverso: que ela não existe. */
  const canonicalEl = $('head link[rel="canonical"]');
  const canonical = canonicalEl.attr('href') ?? '';
  if (noindex) {
    verifica(canonicalEl.length === 0, rota, 'canonical-em-noindex',
      `página noindex não devia declarar canonical ("${canonical}")`);
  } else {
    verifica(canonicalEl.length === 1, rota, 'canonical-unica',
      `encontradas ${canonicalEl.length}`);
    verifica(canonical.startsWith(DOMINIO), rota, 'canonical-absoluta',
      `"${canonical}" não começa por ${DOMINIO}`);
    if (canonical.startsWith(DOMINIO)) {
      const esperado = DOMINIO + rota;
      verifica(canonical === esperado, rota, 'canonical-correta',
        `aponta para "${canonical}", esperado "${esperado}"`);
    }
  }

  /* 4. robots explícito (nada fica ao critério do crawler). */
  verifica($('head meta[name="robots"]').length === 1, rota, 'robots-meta',
    'sem <meta name="robots">');

  /* 5. exatamente um <h1>. Zero: a página não declara o assunto. Dois ou mais:
        declara dois assuntos e o Google escolhe. */
  const h1 = $('h1');
  verifica(h1.length === 1, rota, 'h1-unico', `encontrados ${h1.length} <h1>`);
  if (h1.length === 1) {
    verifica(h1.first().text().trim().length > 0, rota, 'h1-com-texto', '<h1> vazio');
  }

  /* 6. Open Graph completo, com imagem absoluta. */
  for (const prop of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:locale']) {
    verifica($(`head meta[property="${prop}"]`).length === 1, rota, 'og-completo', `falta ${prop}`);
  }
  const ogImg = $('head meta[property="og:image"]').attr('content') ?? '';
  verifica(/^https?:\/\//.test(ogImg), rota, 'og-image-absoluta',
    `"${ogImg}" — as redes sociais não resolvem caminhos relativos`);

  /* 7. JSON-LD: tem de existir, tem de fazer parse e tem de ter @context. */
  const blocos = $('script[type="application/ld+json"]');
  verifica(blocos.length >= 1, rota, 'jsonld-presente', 'sem JSON-LD');
  blocos.each((i, el) => {
    totalVerificacoes++;
    const bruto = $(el).text();
    try {
      const dados = JSON.parse(bruto);
      if (!dados['@context']) falha(rota, 'jsonld-context', `bloco ${i} sem @context`);
      const nos = dados['@graph'] ?? [dados];
      for (const no of nos) {
        if (!no['@type']) falha(rota, 'jsonld-type', `bloco ${i} tem um nó sem @type`);
      }
    } catch (e) {
      falha(rota, 'jsonld-invalido', `bloco ${i} não faz parse: ${e.message}`);
    }
  });

  /* 8. <html lang>. Sem isto o Google adivinha o idioma — e as páginas com
        nomes próprios e números adivinha mal. */
  const lang = $('html').attr('lang') ?? '';
  verifica(lang.length > 0, rota, 'html-lang', 'sem atributo lang no <html>');

  /* 9. viewport (mobile-first indexing: o Google indexa a versão móvel). */
  verifica($('head meta[name="viewport"]').length === 1, rota, 'viewport', 'sem meta viewport');

  /* 10. Todas as <img> com alt (mesmo que vazio, para as decorativas). */
  const semAlt = [];
  $('img').each((_, el) => {
    if ($(el).attr('alt') === undefined) semAlt.push($(el).attr('src') ?? '(sem src)');
  });
  verifica(semAlt.length === 0, rota, 'img-alt',
    `${semAlt.length} <img> sem atributo alt: ${semAlt.slice(0, 3).join(', ')}`);

  /* 11. Nada de vocabulário de mockup no que o Google mostra. */
  const visivelSERP = `${titulo} ${desc}`.toLowerCase();
  verifica(!/mockup|lorem ipsum|placeholder|menu 0\d/.test(visivelSERP), rota, 'sem-placeholder',
    'título ou descrição contêm texto de mockup');

  /* 12. Imagens acima da dobra não devem ser lazy — o lazy no elemento LCP
         atrasa exatamente aquilo que a métrica mede. */
  const heroLazy = $('img[loading="lazy"]').filter((_, el) => {
    const cls = $(el).attr('class') ?? '';
    return /hero|artigo__figura/.test(cls);
  });
  if (heroLazy.length) aviso(rota, 'lcp-lazy', `${heroLazy.length} imagem(ns) de topo com loading="lazy"`);
}

/* ---------------------------- ligações internas --------------------------- */

const rotasExistentes = new Set(paginas.map((p) => p.rota));
const ficheirosEstaticos = new Set(
  listaFicheiros(DIST, () => true).map((f) => '/' + relative(DIST, f).split(sep).join(posix.sep)),
);

for (const pag of paginas) {
  const partidas = [];
  pag.$('a[href]').each((_, el) => {
    const href = pag.$(el).attr('href');
    if (!href || /^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) return;
    const semHash = href.split('#')[0].split('?')[0];
    if (!semHash) return;
    const alvo = semHash.startsWith('/') ? semHash : posix.join(pag.rota, semHash);
    const comBarra = alvo.endsWith('/') ? alvo : alvo + '/';
    if (rotasExistentes.has(comBarra) || ficheirosEstaticos.has(alvo)) return;
    partidas.push(href);
  });
  verifica(partidas.length === 0, pag.rota, 'links-internos',
    `${partidas.length} ligação(ões) sem destino: ${[...new Set(partidas)].slice(0, 5).join(', ')}`);

  /* Imagens que apontam para ficheiros inexistentes. Vale por si — uma imagem
     partida é uma imagem partida — e vale como rede de segurança para a
     otimização de imagens, que muda extensões (.jpg -> .webp): se alguma
     referência ficar para trás num JSON de dados, falha aqui. */
  const imagensPartidas = [];
  pag.$('img[src], link[rel="preload"][as="image"], meta[property="og:image"]').each((_, el) => {
    const $el = pag.$(el);
    const src = $el.attr('src') ?? $el.attr('href') ?? $el.attr('content') ?? '';
    if (!src) return;
    const caminho = src.startsWith(DOMINIO) ? src.slice(DOMINIO.length) : src;
    if (!caminho.startsWith('/') || /^\/\//.test(caminho) || caminho.startsWith('data:')) return;
    if (!ficheirosEstaticos.has(caminho.split('?')[0])) imagensPartidas.push(src);
  });
  verifica(imagensPartidas.length === 0, pag.rota, 'imagens-existem',
    `${imagensPartidas.length} imagem(ns) sem ficheiro: ${[...new Set(imagensPartidas)].slice(0, 4).join(', ')}`);
}

/* --------------------------- sitemap e robots.txt ------------------------- */

const indexSitemap = join(DIST, 'sitemap-index.xml');
totalVerificacoes++;
if (!existsSync(indexSitemap)) {
  falha('(site)', 'sitemap-existe', 'dist/sitemap-index.xml não foi gerado');
} else {
  const partes = readFileSync(indexSitemap, 'utf8').match(/<loc>([^<]+)<\/loc>/g) ?? [];
  const urlsSitemap = new Set();
  for (const p of partes) {
    const url = p.replace(/<\/?loc>/g, '');
    const ficheiroParte = join(DIST, url.replace(DOMINIO, ''));
    if (!existsSync(ficheiroParte)) {
      falha('(site)', 'sitemap-parte', `${url} referido no índice mas ausente do dist/`);
      continue;
    }
    for (const m of readFileSync(ficheiroParte, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
      urlsSitemap.add(m[1]);
    }
  }

  // Toda a página indexável tem de estar no sitemap…
  for (const pag of paginas) {
    if (pag.noindex) continue;
    totalVerificacoes++;
    const esperado = DOMINIO + pag.rota;
    if (!urlsSitemap.has(esperado)) {
      falha(pag.rota, 'sitemap-cobertura', `indexável mas fora do sitemap (${esperado})`);
    }
  }

  // …e nenhuma página noindex pode lá estar (dar ao Google um URL e depois
  // dizer-lhe para não o indexar é gastar orçamento de rastreio a zero).
  for (const pag of paginas) {
    if (!pag.noindex) continue;
    totalVerificacoes++;
    if (urlsSitemap.has(DOMINIO + pag.rota)) {
      falha(pag.rota, 'sitemap-noindex', 'está no sitemap mas é noindex');
    }
  }
}

const robots = join(DIST, 'robots.txt');
totalVerificacoes++;
if (!existsSync(robots)) {
  falha('(site)', 'robots-existe', 'dist/robots.txt não foi gerado');
} else {
  const txt = readFileSync(robots, 'utf8');
  totalVerificacoes++;
  if (!txt.includes(`Sitemap: ${DOMINIO}/sitemap-index.xml`)) {
    falha('(site)', 'robots-sitemap', 'robots.txt não aponta para o sitemap do domínio configurado');
  }
}

/* ------------------------------ configuração ------------------------------ */

totalVerificacoes++;
if (/exemplo|localhost|127\.0\.0\.1/.test(DOMINIO)) {
  falha('(config)', 'dominio', `domínio inválido para produção: ${DOMINIO}`);
}
if (seo.nap.verificado === false) {
  aviso('(config)', 'nap-por-verificar',
    'morada e telefone ficam fora do JSON-LD até seo.json > nap.verificado = true');
}
if (seo.organizacao.sameAs.length === 0) {
  aviso('(config)', 'sameas-vazio',
    'sem perfis em seo.json > organizacao.sameAs (Google Business Profile, LinkedIn, Instagram) — é o que liga a marca à entidade no Google');
}

/* --------------------------------- relatório ------------------------------ */

const porRegra = new Map();
for (const f of falhas) porRegra.set(f.regra, (porRegra.get(f.regra) ?? 0) + 1);

console.log('');
console.log(`Auditoria de SEO — ${paginas.length} páginas, ${totalVerificacoes} verificações`);
console.log(`Domínio configurado: ${DOMINIO}`);
console.log('─'.repeat(72));

if (falhas.length === 0) {
  console.log('Sem falhas.');
} else {
  console.log(`${falhas.length} falha(s):\n`);
  const agrupadas = new Map();
  for (const f of falhas) {
    if (!agrupadas.has(f.regra)) agrupadas.set(f.regra, []);
    agrupadas.get(f.regra).push(f);
  }
  for (const [regra, lista] of agrupadas) {
    console.log(`  [${regra}] ${lista.length}`);
    for (const f of lista.slice(0, 8)) console.log(`      ${f.pagina}  ${f.detalhe}`);
    if (lista.length > 8) console.log(`      … e mais ${lista.length - 8}`);
  }
}

if (avisos.length) {
  console.log('');
  console.log(`${avisos.length} aviso(s) — não bloqueiam, mas valem dinheiro em tráfego:\n`);
  for (const a of avisos) console.log(`  [${a.regra}] ${a.pagina}  ${a.detalhe}`);
}

console.log('─'.repeat(72));
process.exit(falhas.length ? 1 : 0);
