#!/usr/bin/env node
/**
 * Traz as fontes do Google para public/fonts/ e escreve os @font-face.
 *
 * PORQUÊ. O `<link>` para fonts.googleapis.com é render-blocking e está noutro
 * domínio: antes de a primeira letra aparecer, o browser tem de resolver DNS,
 * abrir TLS, pedir o CSS, ler os @font-face e só então pedir os .woff2 — que
 * estão em fonts.gstatic.com, ou seja, outra ligação outra vez. Medido com o
 * Lighthouse neste site, isso custava 1,8 s de First Contentful Paint (2,9 s
 * com o link, 1,1 s sem ele).
 *
 * Servidas do próprio domínio, as fontes chegam na ligação que já está aberta e
 * podem ser pré-carregadas. As letras são exatamente as mesmas — muda o caminho
 * que fazem até ao ecrã.
 *
 * Uso:  node scripts/fontes-descarregar.mjs
 *
 * Reexecutar é seguro: reescreve os ficheiros e o CSS de @font-face. Corre-o
 * outra vez se um dia mudarem os pesos ou as famílias pedidas.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(RAIZ, 'public', 'fonts');

/* O mesmo pedido que estava no <link> do Base.astro. */
const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@300..700&display=swap';

/* Só se traz o que o site precisa de escrever. "latin" cobre o português todo
   (á à â ã ç é ê í ó ô õ ú); "latin-ext" cobre nomes próprios e topónimos do
   resto da Europa, que num site de imobiliário aparecem. Cirílico, grego e
   vietnamita ficam de fora — seriam ficheiros descarregados para nada. */
const SUBCONJUNTOS = ['latin', 'latin-ext'];

/* Ambas as famílias são fontes variáveis: o MESMO ficheiro serve todos os pesos
   do intervalo. O Google, por ter sido pedido peso a peso, declara-o três vezes
   com `font-weight` fixo — e um `font-weight` fixo faz o browser sintetizar (ou
   ignorar) os pesos intermédios. Aqui declara-se o intervalo real, uma só vez. */
const FAMILIAS = {
  Fraunces: { intervaloPeso: '300 500', opticalSizing: true },
  Inter: { intervaloPeso: '300 700', opticalSizing: false },
};

const UA_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA_CHROME } })).text();

/* O CSS do Google vem como uma sequência de comentários com o nome do
   subconjunto seguidos do respetivo @font-face. */
const blocos = [...css.matchAll(
  /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g,
)].map(([, subconjunto, corpo]) => ({
  subconjunto,
  familia: /font-family:\s*'([^']+)'/.exec(corpo)?.[1],
  url: /src:\s*url\(([^)]+)\)/.exec(corpo)?.[1],
  unicodeRange: /unicode-range:\s*([^;]+);/.exec(corpo)?.[1]?.trim(),
}));

mkdirSync(DIR, { recursive: true });

const vistos = new Map();
const declaracoes = [];

for (const familia of Object.keys(FAMILIAS)) {
  for (const sub of SUBCONJUNTOS) {
    const bloco = blocos.find((b) => b.familia === familia && b.subconjunto === sub);
    if (!bloco) {
      console.warn(`  ! ${familia} / ${sub} não veio no CSS do Google — ignorado`);
      continue;
    }
    // O mesmo ficheiro serve os vários pesos; descarrega-se uma vez só.
    const nomeFicheiro = `${familia.toLowerCase()}-${sub}.woff2`;
    if (!vistos.has(bloco.url)) {
      const bytes = Buffer.from(await (await fetch(bloco.url)).arrayBuffer());
      writeFileSync(join(DIR, nomeFicheiro), bytes);
      vistos.set(bloco.url, nomeFicheiro);
      console.log(`  · ${nomeFicheiro}  ${Math.round(bytes.length / 1024)} KB`);
    }
    declaracoes.push(
      `@font-face{` +
      `font-family:'${familia}';` +
      `font-style:normal;` +
      `font-weight:${FAMILIAS[familia].intervaloPeso};` +
      `font-display:swap;` +
      `src:url('/fonts/${vistos.get(bloco.url)}') format('woff2');` +
      `unicode-range:${bloco.unicodeRange};` +
      `}`,
    );
  }
}

/* Os @font-face vão DENTRO do styles.css, entre marcadores, e não para um
   ficheiro à parte: um segundo ficheiro CSS seria um segundo pedido
   render-blocking — exatamente o que se veio aqui eliminar. Os marcadores
   deixam este script reexecutável sem tocar em mais nada da folha de estilo. */
const INICIO = '/* @fontes:inicio — gerado por scripts/fontes-descarregar.mjs, não editar à mão */';
const FIM = '/* @fontes:fim */';

const bloco = [
  INICIO,
  '/* Fontes servidas do próprio domínio. Substituem o <link> para',
  '   fonts.googleapis.com, que era render-blocking e custava ~1,8 s de First',
  '   Contentful Paint (2,9 s com ele, 1,1 s sem — medido com o Lighthouse).',
  '   Pré-carregadas no Base.astro. Reexecutar o script atualiza este bloco. */',
  ...declaracoes,
  FIM,
].join('\n');

const CAMINHO_CSS = join(RAIZ, 'public', 'styles.css');
let folha = readFileSync(CAMINHO_CSS, 'utf8');

if (folha.includes(INICIO) && folha.includes(FIM)) {
  const inicio = folha.indexOf(INICIO);
  const fim = folha.indexOf(FIM) + FIM.length;
  folha = folha.slice(0, inicio) + bloco + folha.slice(fim);
  console.log('\n  bloco de @font-face ATUALIZADO em public/styles.css');
} else {
  folha = bloco + '\n\n' + folha;
  console.log('\n  bloco de @font-face INSERIDO no topo de public/styles.css');
}
writeFileSync(CAMINHO_CSS, folha, 'utf8');

console.log(`  ${declaracoes.length} @font-face, ${vistos.size} ficheiros em public/fonts/\n`);
