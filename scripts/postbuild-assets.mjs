#!/usr/bin/env node
/**
 * Minifica os ficheiros que o Astro NÃO processa.
 *
 * Os ficheiros de `public/` (styles.css, main.js, consent.js) são servidos tal e qual — é essa a
 * convenção do projeto (ver CONTEXTO.md) e é boa: o CSS é documentado ao longo
 * de 3000 linhas e esses comentários são o registo das decisões de desenho.
 *
 * Mas o browser não precisa dos comentários, e o styles.css é render-blocking:
 * o Lighthouse mede ~766 ms de bloqueio só nele. Minificar na SAÍDA resolve os
 * dois lados — os comentários ficam no repositório, os bytes não vão para a
 * rede.
 *
 * Corre automaticamente a seguir ao `astro build` (ver package.json).
 */
import { transform } from 'esbuild';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');

const ALVOS = [
  { ficheiro: 'styles.css', loader: 'css' },
  { ficheiro: 'main.js', loader: 'js' },
  // O consent.js entra pela mesma porta e pela mesma razao: e carregado em
  // TODAS as paginas e sao ~19 KB, dos quais a maior parte sao comentarios a
  // explicar decisoes legais. Ficam no repositorio, nao vao para a rede.
  { ficheiro: 'consent.js', loader: 'js' },
];

let antes = 0;
let depois = 0;
const relatorio = [];

for (const { ficheiro, loader } of ALVOS) {
  const caminho = join(DIST, ficheiro);
  if (!existsSync(caminho)) continue;

  const original = readFileSync(caminho, 'utf8');
  const tamanhoOriginal = statSync(caminho).size;

  const { code } = await transform(original, { loader, minify: true, legalComments: 'none' });

  // Uma minificação que engorda o ficheiro é um erro — não se escreve.
  if (Buffer.byteLength(code) >= tamanhoOriginal) {
    relatorio.push(`  = ${ficheiro} — já mínimo`);
    antes += tamanhoOriginal;
    depois += tamanhoOriginal;
    continue;
  }

  writeFileSync(caminho, code, 'utf8');
  antes += tamanhoOriginal;
  depois += Buffer.byteLength(code);
  relatorio.push(
    `  · ${ficheiro}  ${Math.round(tamanhoOriginal / 1024)} KB → ${Math.round(Buffer.byteLength(code) / 1024)} KB` +
    `  (−${Math.round((1 - Buffer.byteLength(code) / tamanhoOriginal) * 100)}%)`,
  );
}

if (relatorio.length) {
  console.log('\n[postbuild] Minificação dos assets de public/');
  for (const l of relatorio) console.log(l);
  console.log(`  total ${Math.round(antes / 1024)} KB → ${Math.round(depois / 1024)} KB\n`);
}
