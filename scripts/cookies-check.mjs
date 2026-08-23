#!/usr/bin/env node
/**
 * Auditoria do consentimento de cookies sobre o site JÁ CONSTRUÍDO (dist/).
 *
 * Corre contra o HTML final, como o seo-check.mjs, e pela mesma razão: é o HTML
 * final que o visitante recebe e é lá que aparecem os erros que o código-fonte
 * esconde — um script de terceiros que um componente injetou, um botão que um
 * redesenho tornou mais vistoso do que o outro, uma página nova que ficou sem
 * o aviso.
 *
 * Este ficheiro é meio teste, meio documento legal: cada regra aqui é uma
 * exigência do RGPD, da Lei n.º 41/2004 ou das orientações da CNPD, e o
 * comentário diz qual. Quem lhe mexer daqui a um ano tem de perceber que não
 * está a afrouxar um teste — está a afrouxar uma obrigação.
 *
 * Uso:
 *   npm run cookies:check    (assume que já correste o build)
 *   npm run cookies          (build + check)
 *
 * Sai com código 1 se houver falhas — serve para CI.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as cheerio from 'cheerio';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(RAIZ, 'dist');
const cookies = JSON.parse(readFileSync(join(RAIZ, 'src/data/cookies.json'), 'utf8'));
const seo = JSON.parse(readFileSync(join(RAIZ, 'src/data/seo.json'), 'utf8'));
const DOMINIO_PROPRIO = new URL(seo.dominio).host;

const CAT_OPCIONAIS = cookies.categorias.filter((c) => !c.obrigatoria).map((c) => c.id);

const falhas = [];
const avisos = [];
let totalVerificacoes = 0;

function falha(pagina, regra, detalhe) { falhas.push({ pagina, regra, detalhe }); }
function aviso(pagina, regra, detalhe) { avisos.push({ pagina, regra, detalhe }); }
function verifica(condicao, pagina, regra, detalhe) {
  totalVerificacoes++;
  if (!condicao) falha(pagina, regra, detalhe);
}

/* ---------------------------------------------------------------- páginas -- */

/* O back-office do CMS fica fora da auditoria. Não é site público: é uma
   ferramenta de edição, alcançável só por quem tem credenciais do GitHub, que
   não passa pelo Base.astro (logo não tem aviso nenhum) e que carrega o Sveltia
   de um CDN por desenho. O consentimento regula o que se coloca no equipamento
   de VISITANTES; quem entra no /admin/ é o operador do próprio site, a usar uma
   ferramenta que escolheu. Incluí-lo aqui só produzia duas falhas permanentes
   que ninguém pode resolver — e um teste que falha sempre deixa de ser lido. */
const EXCLUIDOS = ['/admin/'];

function listarHtml(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) saida.push(...listarHtml(caminho));
    else if (nome.endsWith('.html')) saida.push(caminho);
  }
  return saida;
}

function rota(ficheiro) {
  const rel = relative(DIST, ficheiro).split(sep).join('/');
  return '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '');
}

if (!existsSync(DIST)) {
  console.error('\n  dist/ não existe. Corre `npm run build` primeiro (ou `npm run cookies`).\n');
  process.exit(1);
}

const paginas = listarHtml(DIST).filter((f) => !EXCLUIDOS.some((e) => rota(f).startsWith(e)));
if (paginas.length === 0) {
  console.error('\n  dist/ não tem HTML nenhum. O build correu?\n');
  process.exit(1);
}

/* ------------------------------------------------------- regras por página -- */

for (const ficheiro of paginas) {
  const pagina = rota(ficheiro);
  const $ = cheerio.load(readFileSync(ficheiro, 'utf8'));

  /* REGRA 1 — a que importa acima de todas.
     Nenhum recurso de terceiros pode ser pedido antes de haver consentimento.
     É a obrigação central do art. 5.º da Lei n.º 41/2004: o consentimento é
     PRÉVIO. Um banner impecável não vale nada se o script já arrancou por trás
     dele — foi exatamente assim que caíram as coimas europeias mais pesadas.
     A única forma permitida de um terceiro estar no HTML é inerte. */
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (!/^https?:\/\//i.test(src)) return;                 // relativo = próprio
    if (new URL(src).host === DOMINIO_PROPRIO) return;      // absoluto para nós próprios
    totalVerificacoes++;
    falha(pagina, 'script de terceiros ativo',
      `${src} — tem de ser inerte: <script type="text/plain" data-ams-consent="…" data-src="…">`);
  });
  $('iframe[src]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (!/^https?:\/\//i.test(src)) return;
    if (new URL(src).host === DOMINIO_PROPRIO) return;
    totalVerificacoes++;
    falha(pagina, 'iframe de terceiros ativo',
      `${src} — um iframe externo lê e escreve no equipamento tal como um script; tem de esperar pelo consentimento`);
  });

  /* REGRA 2 — o aviso existe e nasce escondido.
     `hidden` no HTML servido garante que ninguém vê o aviso antes de o
     consent.js decidir se ele é preciso — e que quem já decidiu nunca vê um
     flash do banner a aparecer e a desaparecer. */
  const raiz = $('#ams-cookies');
  verifica(raiz.length === 1, pagina, 'aviso em falta',
    'não há #ams-cookies nesta página — o <CookieBanner /> está montado no Base.astro?');
  if (raiz.length !== 1) continue;   // sem raiz, as regras seguintes não têm objeto
  verifica(raiz.is('[hidden]'), pagina, 'aviso nasce visível',
    '#ams-cookies tem de trazer o atributo hidden no HTML servido');

  /* REGRA 3 — os controlos que o núcleo liga por delegação existem mesmo.
     O consent.js não falha ruidosamente se um selector desaparecer: simplesmente
     deixa de haver forma de recusar. Este é o teste que apanha isso. */
  for (const accao of ['aceitar', 'rejeitar', 'personalizar', 'guardar', 'fechar']) {
    verifica($(`[data-cookies="${accao}"]`).length > 0, pagina, 'controlo em falta',
      `não há nenhum [data-cookies="${accao}"]`);
  }
  for (const id of CAT_OPCIONAIS) {
    verifica($(`input[data-cookies-cat="${id}"]`).length > 0, pagina, 'categoria sem interruptor',
      `a categoria "${id}" está no cookies.json mas não tem input no painel`);
  }

  /* REGRA 4 — simetria entre aceitar e recusar.
     Orientações da CNPD e do Cookie Banner Taskforce do CEPD: o botão de
     recusar tem de ser tão visível e acessível como o de aceitar. Comparar as
     classes é a forma mecânica de o verificar — se um ganhar um modificador de
     destaque que o outro não tem, o desenho deixou de ser simétrico. Também se
     exige o mesmo NÚMERO de botões: recusar não pode custar mais um clique. */
  const classesDe = (sel) => $(sel).map((_, el) =>
    ($(el).attr('class') || '').split(/\s+/).filter(Boolean).sort().join(' ')).get();
  const aceitar = classesDe('[data-cookies="aceitar"]');
  const rejeitar = classesDe('[data-cookies="rejeitar"]');
  verifica(aceitar.length === rejeitar.length, pagina, 'assimetria de contagem',
    `${aceitar.length} botão(ões) de aceitar contra ${rejeitar.length} de rejeitar`);
  aceitar.forEach((cls, i) => {
    if (rejeitar[i] === undefined) return;
    verifica(cls === rejeitar[i], pagina, 'assimetria de estilo',
      `aceitar tem class="${cls}" e rejeitar tem class="${rejeitar[i]}" — têm de ser idênticas`);
  });

  /* REGRA 5 — nada pré-consentido.
     Art. 4.º, n.º 11 do RGPD: o consentimento é um ato POSITIVO. Uma caixa que
     já vem marcada recolhe silêncio, e silêncio não é consentimento. */
  for (const id of CAT_OPCIONAIS) {
    verifica($(`input[data-cookies-cat="${id}"][checked]`).length === 0, pagina, 'toggle pré-marcado',
      `a categoria opcional "${id}" vem checked no HTML`);
  }

  /* REGRA 6 — acessibilidade. Um aviso que um utilizador de leitor de ecrã não
     consegue operar é um aviso que lhe nega a escolha, não um detalhe de UX. */
  const nomeAcessivel = (el) => {
    const $el = $(el);
    if (($el.attr('aria-label') || '').trim()) return true;
    const id = ($el.attr('aria-labelledby') || '').trim();
    return id ? $(`#${id}`).length > 0 : false;   // tem de apontar para algo que existe
  };
  const barra = $('.cookies__aviso');
  const painel = $('.cookies__painel');
  verifica(barra.attr('role') === 'dialog', pagina, 'a11y', '.cookies__aviso sem role="dialog"');
  verifica(barra.length > 0 && nomeAcessivel(barra[0]), pagina, 'a11y',
    '.cookies__aviso sem nome acessível (aria-label ou aria-labelledby que resolva)');
  verifica(painel.attr('role') === 'dialog', pagina, 'a11y', '.cookies__painel sem role="dialog"');
  verifica(painel.attr('aria-modal') === 'true', pagina, 'a11y', '.cookies__painel sem aria-modal="true"');
  verifica(painel.length > 0 && nomeAcessivel(painel[0]), pagina, 'a11y',
    '.cookies__painel sem nome acessível');

  /* REGRA 7 — retirar tem de ser tão fácil como dar (art. 7.º, n.º 3 do RGPD).
     "Tão fácil" só é verdade se o gatilho estiver em TODAS as páginas. */
  verifica($('[data-cookies="abrir"]').length > 0, pagina, 'sem via de retirada',
    'nenhum [data-cookies="abrir"] nesta página — o rodapé perdeu o botão de definições?');

  /* REGRA 8 — as políticas estão sempre a um clique. */
  verifica($('a[href^="/politica-de-cookies"]').length > 0, pagina, 'sem link para a política',
    'falta ligação para /politica-de-cookies/');
  verifica($('a[href^="/politica-de-privacidade"]').length > 0, pagina, 'sem link para a privacidade',
    'falta ligação para /politica-de-privacidade/');

  /* AVISO — o beacon de estatísticas, quando existir token, tem de estar inerte. */
  if (seo.analytics?.cloudflareToken) {
    const inerte = $('script[type="text/plain"][data-ams-consent="estatisticas"]').length > 0;
    if (!inerte) aviso(pagina, 'analytics sem gate',
      'há token de Cloudflare configurado mas nenhum script inerte de estatísticas nesta página');
  }
}

/* --------------------------------------------------------- regras globais -- */

const GLOBAL = '(global)';

/* As duas páginas legais têm de existir mesmo — as regras acima só verificam
   que há ligações para elas, e uma ligação para o vazio é pior do que nenhuma. */
for (const rotaLegal of ['politica-de-cookies', 'politica-de-privacidade']) {
  verifica(existsSync(join(DIST, rotaLegal, 'index.html')), GLOBAL, 'página legal em falta',
    `dist/${rotaLegal}/index.html não foi gerado`);
}

/* O inventário e a política não podem divergir. Se alguém acrescentar um
   serviço ao cookies.json e a política não o mostrar, o site passa a usar algo
   que não declarou — que é precisamente o que a CNPD sanciona. Como a tabela é
   gerada a partir do JSON, isto só falha se a geração for desligada. */
const ficheiroPolitica = join(DIST, 'politica-de-cookies', 'index.html');
if (existsSync(ficheiroPolitica)) {
  const texto = cheerio.load(readFileSync(ficheiroPolitica, 'utf8')).text();
  for (const item of cookies.inventario) {
    verifica(texto.includes(item.nome), '/politica-de-cookies/', 'inventário não declarado',
      `"${item.nome}" está no cookies.json mas não aparece na página`);
  }
  for (const cat of cookies.categorias) {
    verifica(texto.includes(cat.nome), '/politica-de-cookies/', 'categoria não descrita',
      `a categoria "${cat.nome}" não é mencionada na política`);
  }
}

/* O núcleo tem de ir para produção e tem de ser JS válido. Um erro de sintaxe
   no consent.js não parte o build (é um ficheiro estático em public/): parte o
   consentimento em silêncio, e o site fica a mostrar um banner que não faz nada. */
const consentDist = join(DIST, 'consent.js');
verifica(existsSync(consentDist), GLOBAL, 'núcleo em falta', 'dist/consent.js não existe');
if (existsSync(consentDist)) {
  totalVerificacoes++;
  try {
    execFileSync(process.execPath, ['--check', consentDist], { stdio: 'pipe' });
  } catch (e) {
    falha(GLOBAL, 'núcleo inválido', `node --check falhou em dist/consent.js: ${String(e.stderr || e).trim()}`);
  }
}

/* --------------------------------------------------------------- relatório -- */

const linha = '─'.repeat(72);
console.log('\n' + linha);
console.log('  Auditoria de cookies e consentimento');
console.log(`  ${paginas.length} páginas · ${totalVerificacoes} verificações`);
console.log(linha + '\n');

if (avisos.length) {
  console.log(`  AVISOS (${avisos.length})\n`);
  for (const a of avisos) console.log(`   ~ ${a.pagina}\n     ${a.regra}: ${a.detalhe}`);
  console.log('');
}

if (falhas.length) {
  console.log(`  FALHAS (${falhas.length})\n`);
  /* Agrupadas por regra e não por página: um selector que desapareceu falha em
     30 páginas de uma vez, e 30 linhas iguais escondem a segunda falha. */
  const porRegra = new Map();
  for (const f of falhas) {
    if (!porRegra.has(f.regra)) porRegra.set(f.regra, []);
    porRegra.get(f.regra).push(f);
  }
  for (const [regra, itens] of porRegra) {
    console.log(`   ✗ ${regra}  (${itens.length})`);
    console.log(`     ${itens[0].detalhe}`);
    const paginasAfetadas = [...new Set(itens.map((i) => i.pagina))];
    const mostra = paginasAfetadas.slice(0, 5).join(', ');
    console.log(`     em: ${mostra}${paginasAfetadas.length > 5 ? ` … (+${paginasAfetadas.length - 5})` : ''}\n`);
  }
  console.log(linha);
  console.log('  Ver docs/COOKIES.md para o que cada regra protege.\n');
  process.exit(1);
}

console.log('  ✓ Sem falhas. Nenhum recurso de terceiros arranca antes do consentimento,');
console.log('    aceitar e recusar têm o mesmo peso, e a retirada está a um clique.\n');
