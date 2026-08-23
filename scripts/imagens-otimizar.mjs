#!/usr/bin/env node
/**
 * Otimização das imagens de public/images.
 *
 * O problema: o site servia os ficheiros como saíram da máquina fotográfica —
 * 5841x3899 px, 1,7 MB — a um telemóvel que os desenha com 400 px de largura.
 * O browser descarrega a imagem inteira antes de a poder encolher, e é isso que
 * empurra o LCP para lá dos 7 segundos. O Largest Contentful Paint é fator de
 * ranking confirmado; aqui é a diferença entre uma página lenta e uma rápida.
 *
 * O que faz:
 *   — reduz cada imagem ao tamanho máximo em que é MESMO mostrada (com folga
 *     para ecrãs de alta densidade);
 *   — converte fotografias JPEG para WebP (30–40% menos peso à mesma
 *     qualidade); os PNG ficam PNG, porque precisam de transparência;
 *   — nunca amplia: uma imagem já pequena passa incólume.
 *
 * Uso:
 *   node scripts/imagens-otimizar.mjs            (simulação — não escreve nada)
 *   node scripts/imagens-otimizar.mjs --aplicar  (escreve; apaga o original só
 *                                                 quando muda de formato)
 *
 * Depois de aplicar com mudança de formato, é preciso atualizar as referências
 * (.jpg -> .webp) nos JSON de src/data. O `npm run seo:check` apanha qualquer
 * referência que fique para trás.
 */
import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, sep, posix, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(RAIZ, 'public', 'images');
const APLICAR = process.argv.includes('--aplicar');

/* Limite do lado maior, por finalidade. Os números não são arbitrários: são o
   dobro do tamanho de apresentação, que é o que um ecrã 2x precisa. Acima
   disso são bytes que ninguém vê. */
const LIMITES = [
  { teste: /perfil-\d+\./, max: 1200, porque: 'retrato de equipa, mostrado a ~450 px' },
  { teste: /logo-|santos_logo/, max: 700, porque: 'logótipo, mostrado a ~200 px' },
  { teste: /.*/, max: 2000, porque: 'fotografia de secção, pode ocupar a largura toda' },
];

const QUALIDADE_WEBP = 82;

function percorre(d, acc = []) {
  for (const nome of readdirSync(d)) {
    const p = join(d, nome);
    if (statSync(p).isDirectory()) percorre(p, acc);
    else if (/\.(jpe?g|png|webp)$/i.test(nome)) acc.push(p);
  }
  return acc;
}

const rel = (f) => '/' + f.replace(join(RAIZ, 'public') + sep, '').split(sep).join(posix.sep);

let antes = 0;
let depois = 0;
const renomeados = [];

console.log(APLICAR ? '\nA OTIMIZAR (a escrever no disco)\n' : '\nSIMULAÇÃO — nada é escrito. Usa --aplicar para escrever.\n');

for (const f of percorre(DIR)) {
  const tamanhoOriginal = statSync(f).size;
  antes += tamanhoOriginal;

  const nome = basename(f);
  const regra = LIMITES.find((l) => l.teste.test(nome));
  const ext = extname(f).toLowerCase();
  const eFoto = ext === '.jpg' || ext === '.jpeg';

  const img = sharp(f);
  const meta = await img.metadata();
  const ladoMaior = Math.max(meta.width, meta.height);
  const precisaEncolher = ladoMaior > regra.max;

  // Um WebP já dentro do limite não se toca: reprocessar só volta a perder
  // qualidade sem ganhar bytes que valham a pena.
  if (!precisaEncolher && !eFoto) {
    depois += tamanhoOriginal;
    continue;
  }

  const destino = eFoto ? join(dirname(f), basename(f, ext) + '.webp') : f;

  let pipeline = sharp(f);
  if (precisaEncolher) {
    pipeline = pipeline.resize({
      width: meta.width >= meta.height ? regra.max : undefined,
      height: meta.height > meta.width ? regra.max : undefined,
      withoutEnlargement: true,
    });
  }
  pipeline = ext === '.png'
    ? pipeline.png({ compressionLevel: 9, palette: true })
    : pipeline.webp({ quality: QUALIDADE_WEBP });

  const buffer = await pipeline.toBuffer();

  // Se a "otimização" engordou o ficheiro (acontece com PNG já bem comprimido),
  // fica o original.
  if (buffer.length >= tamanhoOriginal && destino === f) {
    depois += tamanhoOriginal;
    console.log(`  = ${rel(f)} — já otimizado, sem alteração`);
    continue;
  }

  depois += buffer.length;
  const poupanca = Math.round((1 - buffer.length / tamanhoOriginal) * 100);
  const mudaFormato = destino !== f;
  console.log(
    `  ${mudaFormato ? '→' : '·'} ${rel(f)}` +
    `\n      ${meta.width}x${meta.height} ${Math.round(tamanhoOriginal / 1024)} KB` +
    ` → ${precisaEncolher ? 'máx ' + regra.max + 'px' : 'mesmas dimensões'} ${Math.round(buffer.length / 1024)} KB` +
    `  (−${poupanca}%)` +
    (mudaFormato ? `\n      novo nome: ${rel(destino)}` : '') +
    `\n      motivo do limite: ${regra.porque}`,
  );

  if (mudaFormato) renomeados.push([rel(f), rel(destino)]);

  if (APLICAR) {
    await sharp(buffer).toFile(destino);
    if (mudaFormato) unlinkSync(f);
  }
}

console.log('\n' + '─'.repeat(72));
console.log(`Total: ${(antes / 1024 / 1024).toFixed(2)} MB → ${(depois / 1024 / 1024).toFixed(2)} MB` +
  `  (−${Math.round((1 - depois / antes) * 100)}%)`);

if (renomeados.length) {
  console.log('\nReferências a atualizar (a extensão mudou):');
  for (const [de, para] of renomeados) console.log(`  ${de}  →  ${para}`);
  console.log('\nDepois de as atualizar, corre `npm run seo` para confirmar que nenhuma ficou para trás.');
}
console.log('');
