#!/usr/bin/env node
/**
 * Confere que TUDO o que está nos ficheiros de conteúdo é editável no CMS.
 *
 * Para cada coleção do public/admin/config.yml (ficheiros fixos e pastas),
 * percorre os dados e os campos declarados em paralelo e aponta:
 *   - FALHA: chave nos dados sem campo no CMS — não aparece no painel, e o
 *            CMS pode apagá-la ao guardar;
 *   - FALHA: ficheiro de src/data sem coleção nenhuma;
 *   - AVISO: campo declarado que não existe nos dados (fica vazio no painel —
 *            normal num campo opcional, suspeito num obrigatório).
 *
 * Uso:  npm run cms:check      Sai com código 1 se houver falhas.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const config = yaml.load(readFileSync(join(RAIZ, 'public/admin/config.yml'), 'utf8'));

const falhas = [];
const avisos = [];

const lerJson = (rel) => JSON.parse(readFileSync(join(RAIZ, rel), 'utf8'));
const eObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Compara um valor com a definição de um campo; `onde` é o caminho legível. */
function confere(valor, campo, onde) {
  if (valor === undefined) {
    const temDefault = campo.default !== undefined || campo.widget === 'boolean';
    if (campo.required !== false && campo.widget !== 'hidden' && !temDefault) avisos.push(`${onde}: campo obrigatório sem valor nos dados`);
    return;
  }
  if (campo.widget === 'object') return confereObjeto(valor, campo.fields, onde);
  if (campo.widget === 'list' && Array.isArray(valor)) {
    valor.forEach((item, i) => {
      if (campo.fields) confereObjeto(item, campo.fields, `${onde}[${i}]`);
      else if (campo.field?.widget === 'object') confereObjeto(item, campo.field.fields, `${onde}[${i}]`);
    });
  }
}

function confereObjeto(dados, campos = [], onde) {
  if (!eObjeto(dados)) return;
  const porNome = new Map(campos.map((c) => [String(c.name), c]));
  for (const chave of Object.keys(dados)) {
    if (!porNome.has(chave)) falhas.push(`${onde}.${chave}: existe nos dados mas não no CMS`);
  }
  for (const [nome, campo] of porNome) confere(dados[nome], campo, `${onde}.${nome}`);
}

const cobertos = new Set();
for (const col of config.collections) {
  if (col.files) {
    for (const f of col.files) {
      cobertos.add(f.file);
      confereObjeto(lerJson(f.file), f.fields, f.file);
    }
  } else if (col.folder && col.format === 'json') {
    for (const nome of readdirSync(join(RAIZ, col.folder)).filter((n) => n.endsWith('.json'))) {
      const rel = posix.join(col.folder, nome);
      confereObjeto(lerJson(rel), col.fields, rel);
    }
  }
}

for (const nome of readdirSync(join(RAIZ, 'src/data')).filter((n) => n.endsWith('.json'))) {
  const rel = `src/data/${nome}`;
  if (!cobertos.has(rel)) falhas.push(`${rel}: ficheiro sem coleção no CMS`);
}

avisos.forEach((a) => console.log(`  aviso  ${a}`));
falhas.forEach((f) => console.log(`  FALHA  ${f}`));
console.log(`\n${falhas.length} falha(s), ${avisos.length} aviso(s).`);
process.exit(falhas.length ? 1 : 0);
