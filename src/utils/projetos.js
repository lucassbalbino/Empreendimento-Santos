// Acesso único aos empreendimentos (src/content/empreendimentos/*.json).
// As páginas Portfólio, Histórico, Início e a ficha derivam daqui — assim as
// listagens nunca divergem das páginas de detalhe nem partem links.
import { getCollection } from 'astro:content';

/**
 * O ciclo de vida de um projeto: futuro → desenvolvimento → concluido.
 * A fase (campo `grupo`) é a ÚNICA coisa a mudar no CMS para mover um projeto;
 * tudo o que dela depende sai desta tabela. Acrescentar uma fase = uma linha
 * aqui + a opção no config.yml + o enum em src/content/config.ts.
 *
 *  - estado:    estado da obra quando o ficheiro não o fixa;
 *  - comercial: situação comercial imposta pela fase (o Histórico é, por
 *               definição, o que já está vendido) — `null` = a do ficheiro;
 *  - listagem:  página onde o projeto aparece (e para onde volta a migalha).
 */
export const FASES = {
  futuro: { estado: 'Em projeto', comercial: null, listagem: { nome: 'Portfólio', caminho: '/portfolio' } },
  desenvolvimento: { estado: 'Em construção', comercial: null, listagem: { nome: 'Portfólio', caminho: '/portfolio' } },
  concluido: { estado: 'Concluído', comercial: 'Vendido', listagem: { nome: 'Histórico', caminho: '/historico' } },
};

/** Frase de entrega por omissão, a partir do estado da obra e do ano. */
const ENTREGA = {
  'Em projeto': (ano) => `Previsão ${ano}`,
  'Em construção': (ano) => `Em construção · ${ano}`,
  'Concluído': (ano) => `Concluído em ${ano}`,
};

/** Valor da linha "Estado" da ficha técnica. */
function estadoFicha(estado, comercial) {
  if (comercial !== 'Vendido') return estado;
  return estado === 'Concluído' ? 'Vendido' : `${estado} / Vendido`;
}

/**
 * A ficha técnica é sempre a mesma lista de linhas, pela mesma ordem, em
 * todos os empreendimentos — nunca um campo livre por projeto (era assim que
 * um ficava sem Tipologia e outro ganhava uma linha "Vista" que mais nenhum
 * tinha). "Arquiteto" é a única opcional: só aparece quando preenchida.
 * "Comercialização" é fixa — a Empreendimentos Santos comercializa sempre através da
 * SF Properties.
 */
function fichaTecnica({ localizacao, tipologia, unidades, arquitecto }, estado, comercial) {
  return [
    { rotulo: 'Localização', valor: localizacao },
    { rotulo: 'Tipologia', valor: tipologia },
    ...(unidades ? [{ rotulo: 'Unidades', valor: unidades }] : []),
    { rotulo: 'Estado', valor: estadoFicha(estado, comercial) },
    ...(arquitecto ? [{ rotulo: 'Arquiteto', valor: arquitecto }] : []),
    { rotulo: 'Comercialização', valor: 'SF Properties' },
  ];
}

function normaliza({ id, data }) {
  const fase = FASES[data.grupo];
  const estado = data.estado ?? fase.estado;
  const comercial = fase.comercial ?? data.comercial;
  return {
    ...data,
    slug: id,
    estado,
    comercial,
    entrega: data.entrega ?? ENTREGA[estado](data.ano),
    factos: fichaTecnica(data, estado, comercial),
  };
}

// Mais recentes primeiro; no mesmo ano, os marcados como destaque e depois o
// nome — a ordem nunca depende de como o sistema de ficheiros lista as entradas.
export const todos = (await getCollection('empreendimentos'))
  .map(normaliza)
  .sort((a, b) => b.ano - a.ano || b.destaque - a.destaque || a.nome.localeCompare(b.nome, 'pt'));

/** Projetos de uma fase ('concluido' | 'desenvolvimento' | 'futuro'), mais recentes primeiro. */
export function porGrupo(grupo) {
  return todos.filter((p) => p.grupo === grupo);
}

/** Empreendimentos em destaque na home: em construção primeiro, depois em projeto. */
export function emDestaque(limite = 8) {
  return [...porGrupo('desenvolvimento'), ...porGrupo('futuro')].slice(0, limite);
}

/** Projetos por slug — usado pela rota dinâmica. */
export function porSlug(slug) {
  return todos.find((p) => p.slug === slug);
}
