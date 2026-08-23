import seo from '../data/seo.json';

/* ---------------------------------------------------------------------------
   Helpers de SEO. Tudo aqui lê o src/data/seo.json — mudar o domínio nesse
   ficheiro propaga para canonical, Open Graph, sitemap, robots e JSON-LD.
   --------------------------------------------------------------------------- */

/** Domínio sem barra final: "https://www.amsantos.pt" */
export const DOMINIO = seo.dominio.replace(/\/+$/, '');

/**
 * Caminho -> URL absoluta. Aceita já-absoluto (devolve tal e qual).
 * As páginas do site são servidas em formato de diretório (`/portfolio/`),
 * por isso normalizamos SEMPRE com barra final — uma canonical sem barra e
 * um sitemap com barra são, para o Google, dois URLs a competir entre si.
 */
export function urlAbsoluto(caminho = '/', { barraFinal = true } = {}) {
  if (/^https?:\/\//i.test(caminho)) return caminho;
  let p = caminho.startsWith('/') ? caminho : `/${caminho}`;
  const temExtensao = /\.[a-z0-9]{2,5}$/i.test(p);
  if (barraFinal && !temExtensao && !p.endsWith('/')) p += '/';
  return DOMINIO + p;
}

/** Caminho normalizado para servir de chave em seo.paginas ("/portfolio"). */
export function normalizaCaminho(pathname = '/') {
  const p = pathname.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

/**
 * Resolve o SEO de uma página: primeiro o que a página passou explicitamente,
 * depois a entrada de seo.paginas para o caminho, depois o global.
 * As páginas estáticas não precisam de passar nada — vão buscar ao seo.json.
 */
export function seoDaPagina(pathname, overrides = {}) {
  const chave = normalizaCaminho(pathname);
  const base = seo.paginas[chave] ?? {};
  const limpos = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v != null));
  const resolvido = { ...base, ...limpos };
  return {
    title: resolvido.title ?? `${seo.marca} — ${seo.organizacao.slogan}`,
    description: resolvido.description ?? seo.organizacao.descricao,
    imagem: resolvido.imagem ?? seo.imagemPadrao,
    noindex: resolvido.noindex === true || seo.indexavel === false,
    tipo: resolvido.tipo ?? 'website',
  };
}

/**
 * Migalhas (breadcrumbs). O Google ainda mostra breadcrumb rich results e usa-os
 * para perceber a hierarquia do site — é dos poucos schemas que continuam a ter
 * efeito visível na SERP depois da limpeza de FAQ/HowTo.
 * Devolve [] na home: uma migalha de um só item não diz nada a ninguém.
 */
export function trilho(pathname, extra = []) {
  const chave = normalizaCaminho(pathname);
  if (chave === '/') return [];
  const inicio = { nome: 'Início', caminho: '/' };
  if (extra.length) return [inicio, ...extra];
  const titulo = seo.paginas[chave]?.title?.split(/\s+[—|]\s+/)[0] ?? chave.replace(/^\//, '');
  return [inicio, { nome: titulo, caminho: chave }];
}

export { seo };
