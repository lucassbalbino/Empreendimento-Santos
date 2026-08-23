#!/usr/bin/env node
/**
 * Inventário das imagens de public/images: peso, dimensões e formato.
 *
 * O peso das imagens é, neste site, a maior fatia do LCP — e o LCP é um fator
 * de ranking confirmado. Este script só mede; quem corrige é o
 * `imagens-otimizar.mjs`.
 */
import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';
import { join, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(RAIZ, 'public', 'images');

function percorre(d, acc = []) {
  for (const nome of readdirSync(d)) {
    const p = join(d, nome);
    if (statSync(p).isDirectory()) percorre(p, acc);
    else if (/\.(jpe?g|png|webp|avif)$/i.test(nome)) acc.push(p);
  }
  return acc;
}

const linhas = [];
let total = 0;

for (const f of percorre(DIR)) {
  const bytes = statSync(f).size;
  total += bytes;
  let meta = {};
  try {
    meta = await sharp(f).metadata();
  } catch {
    meta = { width: '?', height: '?', format: '?' };
  }
  linhas.push({
    kb: Math.round(bytes / 1024),
    dim: `${meta.width}x${meta.height}`,
    fmt: meta.format,
    rel: '/' + f.replace(join(RAIZ, 'public') + sep, '').split(sep).join(posix.sep),
  });
}

linhas.sort((a, b) => b.kb - a.kb);

console.log(`\n${linhas.length} imagens, ${(total / 1024 / 1024).toFixed(2)} MB no total\n`);
console.log('    PESO    DIMENSÕES  FORMATO  FICHEIRO');
console.log('─'.repeat(80));
for (const l of linhas) {
  const marca = l.kb > 200 ? '  <<' : '';
  console.log(`${(l.kb + ' KB').padStart(8)}  ${l.dim.padStart(11)}  ${String(l.fmt).padEnd(7)}  ${l.rel}${marca}`);
}
console.log('─'.repeat(80));
console.log('«<<» = acima de 200 KB. Numa página que carrega várias, é aqui que o LCP se perde.\n');
