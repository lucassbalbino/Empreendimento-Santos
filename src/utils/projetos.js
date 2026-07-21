// Acesso único à lista de empreendimentos (src/data/empreendimentos.json).
// As páginas Portfólio, Histórico e Início derivam daqui — assim as listagens
// nunca divergem das páginas de detalhe nem partem links.
import data from '../data/empreendimentos.json';

export const todos = data.lista;

/** Projetos de um grupo ('concluido' | 'desenvolvimento' | 'futuro'), mais recentes primeiro. */
export function porGrupo(grupo) {
  return todos.filter((p) => p.grupo === grupo).sort((a, b) => b.ano - a.ano);
}

/** Empreendimentos em destaque na home: em construção primeiro, depois em projeto. */
export function emDestaque(limite = 8) {
  return [...porGrupo('desenvolvimento'), ...porGrupo('futuro')].slice(0, limite);
}

/** Projetos por slug — usado pela rota dinâmica. */
export function porSlug(slug) {
  return todos.find((p) => p.slug === slug);
}
