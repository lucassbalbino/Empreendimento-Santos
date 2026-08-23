import { seo, DOMINIO, urlAbsoluto } from './seo.js';

/* ---------------------------------------------------------------------------
   Construtores de JSON-LD (schema.org).

   Estratégia: um único bloco <script type="application/ld+json"> por página,
   com um @graph. Os nós globais (Organization, WebSite) têm @id fixo e são
   referenciados por { "@id": ... } em vez de repetidos — é assim que o Google
   liga a página à entidade da empresa em vez de ver ilhas soltas.

   Nota sobre o que NÃO está aqui: FAQPage e HowTo. O Google deixou de mostrar
   FAQ rich results em maio de 2026 (e removeu o relatório em junho), por isso
   o schema de FAQ já não paga o custo de manutenção. O conteúdo de perguntas
   e respostas continua a valer — em HTML normal, legível por pessoas e por
   motores de resposta —, só não vale como marcação.
   --------------------------------------------------------------------------- */

export const ID_ORG = DOMINIO + '/#organizacao';
export const ID_SITE = DOMINIO + '/#website';

/** Morada só entra no grafo quando o NAP está verificado (ver seo.json). */
function morada() {
  const n = seo.nap;
  if (!n.verificado) return null;
  return {
    '@type': 'PostalAddress',
    streetAddress: n.morada,
    postalCode: n.codigoPostal,
    addressLocality: n.localidade,
    addressRegion: n.regiao,
    addressCountry: n.pais,
  };
}

function semVazios(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0)),
  );
}

/**
 * A entidade "AM Santos". Dupla tipagem de propósito: Organization dá o nó
 * genérico que o Knowledge Graph entende, HomeAndConstructionBusiness diz ao
 * Google que o negócio é construção civil — é a categoria que alinha o site
 * com as pesquisas locais de "construtora" / "promotora".
 */
export function organizacao() {
  const o = seo.organizacao;
  const nap = seo.nap;
  return semVazios({
    '@type': ['Organization', 'HomeAndConstructionBusiness'],
    '@id': ID_ORG,
    name: seo.marca,
    legalName: o.nomeLegal,
    url: DOMINIO + '/',
    description: o.descricao,
    slogan: o.slogan,
    logo: {
      '@type': 'ImageObject',
      url: urlAbsoluto(o.logo, { barraFinal: false }),
      caption: seo.marca,
    },
    image: urlAbsoluto(seo.imagemPadrao, { barraFinal: false }),
    founder: { '@type': 'Person', name: o.fundador },
    knowsAbout: o.especialidades,
    areaServed: o.areasServidas.map((a) => ({ '@type': 'AdministrativeArea', name: a })),
    address: morada(),
    telephone: nap.verificado ? nap.telefone : null,
    email: nap.verificado ? nap.email : null,
    openingHours: nap.verificado ? nap.horario : null,
    sameAs: o.sameAs,
  });
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': ID_SITE,
    url: DOMINIO + '/',
    name: seo.marca,
    inLanguage: seo.idioma,
    publisher: { '@id': ID_ORG },
  };
}

/** O nó da página. `tipo` permite CollectionPage, AboutPage, ContactPage, … */
export function pagina({ url, title, description, imagem, tipo = 'WebPage', temTrilho = false }) {
  return semVazios({
    '@type': tipo,
    '@id': url + '#pagina',
    url,
    name: title,
    description,
    inLanguage: seo.idioma,
    isPartOf: { '@id': ID_SITE },
    about: { '@id': ID_ORG },
    primaryImageOfPage: imagem ? { '@type': 'ImageObject', url: imagem } : null,
    breadcrumb: temTrilho ? { '@id': url + '#trilho' } : null,
  });
}

export function trilhoSchema(itens, urlPagina) {
  if (!itens.length) return null;
  return {
    '@type': 'BreadcrumbList',
    '@id': urlPagina + '#trilho',
    itemListElement: itens.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nome,
      item: urlAbsoluto(it.caminho),
    })),
  };
}

/* --------------------------------- imóveis -------------------------------- */

/**
 * O tipo schema.org certo para o empreendimento. Não é decoração: um
 * ApartmentComplex e uma SingleFamilyResidence respondem a pesquisas
 * diferentes, e o portefólio da AM Santos tem os dois — mais um centro
 * logístico e um hotel, que não são residências de todo.
 */
export function tipoDeImovel(proj) {
  const t = (proj.nome + ' ' + (proj.tipologia || '') + ' ' + (proj.unidades || '')).toLowerCase();
  if (/hotel|hotelei/.test(t)) return 'Hotel';
  if (/log[íi]stic|armaz[ée]m|industrial/.test(t)) return 'Place';
  if (/moradia|villa|unifamiliar/.test(t)) return 'SingleFamilyResidence';
  return 'ApartmentComplex';
}

/** "10 apartamentos" -> 10. Devolve null quando não há número fiável. */
function contaUnidades(unidades) {
  const m = /(\d+)/.exec(unidades || '');
  return m ? Number(m[1]) : null;
}

export function imovel(proj, url) {
  const tipo = tipoDeImovel(proj);
  const unidades = contaUnidades(proj.unidades);
  const factos = (proj.factos || []).map((f) => ({
    '@type': 'PropertyValue',
    name: f.rotulo,
    value: String(f.valor),
  }));

  return semVazios({
    '@type': tipo,
    '@id': url + '#imovel',
    name: proj.nome,
    description: proj.resumo,
    url,
    image: proj.imagem ? urlAbsoluto(proj.imagem, { barraFinal: false }) : null,
    address: semVazios({
      '@type': 'PostalAddress',
      addressLocality: proj.localizacao,
      addressRegion: proj.concelho || proj.localizacao,
      addressCountry: 'PT',
    }),
    numberOfAccommodationUnits:
      unidades && tipo === 'ApartmentComplex'
        ? { '@type': 'QuantitativeValue', value: unidades }
        : null,
    additionalProperty: factos,
    provider: { '@id': ID_ORG },
  });
}

/** Grelha de empreendimentos (portfólio / histórico) como ItemList ordenada. */
export function listaDeImoveis(projetos, { url, nome }) {
  return {
    '@type': 'ItemList',
    '@id': url + '#lista',
    name: nome,
    numberOfItems: projetos.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: projetos.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.nome,
      url: urlAbsoluto('/empreendimentos/' + p.slug),
    })),
  };
}

/* --------------------------------- pessoas -------------------------------- */

export function listaDePessoas(membros, { url, nome }) {
  return {
    '@type': 'ItemList',
    '@id': url + '#equipa',
    name: nome,
    numberOfItems: membros.length,
    itemListElement: membros.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: semVazios({
        '@type': 'Person',
        name: m.name,
        jobTitle: m.role,
        description: m.bio,
        image: m.foto ? urlAbsoluto(m.foto, { barraFinal: false }) : null,
        worksFor: { '@id': ID_ORG },
      }),
    })),
  };
}

/* --------------------------------- artigos -------------------------------- */

export function artigo(post, url) {
  return semVazios({
    '@type': 'BlogPosting',
    '@id': url + '#artigo',
    headline: post.titulo,
    description: post.resumo,
    url,
    datePublished: post.data,
    dateModified: post.atualizado || post.data,
    image: post.imagem ? urlAbsoluto(post.imagem, { barraFinal: false }) : null,
    author: { '@type': 'Person', name: post.autor || seo.organizacao.fundador },
    publisher: { '@id': ID_ORG },
    inLanguage: seo.idioma,
    isPartOf: { '@id': ID_SITE },
    mainEntityOfPage: { '@id': url + '#pagina' },
    keywords: post.tags,
  });
}

/** Junta os nós num único grafo, descartando os nulos. */
export function grafo(nos) {
  return {
    '@context': 'https://schema.org',
    '@graph': nos.filter(Boolean),
  };
}
