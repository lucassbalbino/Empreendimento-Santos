import { defineCollection, z } from 'astro:content';

/**
 * Coleção de artigos do blog.
 *
 * Markdown (e não JSON como o resto do conteúdo do site) por duas razões: o
 * corpo de um artigo é texto longo com cabeçalhos e listas — que é exatamente
 * o que o Markdown descreve bem e um campo de JSON descreve mal — e o Sveltia
 * CMS edita uma pasta de Markdown com um editor de texto rico, sem o cliente
 * ter de ver marcação nenhuma.
 *
 * `data` e `atualizado` alimentam o datePublished / dateModified do
 * BlogPosting. Não são decoração: um artigo sem data é um artigo que o Google
 * não sabe se está atual, e "atualidade" é meio critério de qualidade num
 * tema — mercado imobiliário — onde tudo muda de ano para ano.
 */
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    titulo: z.string(),
    resumo: z.string(),
    data: z.coerce.date(),
    atualizado: z.coerce.date().optional(),
    autor: z.string().default('AM Santos'),
    imagem: z.string().optional(),
    tags: z.array(z.string()).default([]),
    /** Título alternativo para a SERP, quando o título editorial é longo. */
    seoTitulo: z.string().optional(),
    rascunho: z.boolean().default(false),
  }),
});

/**
 * Empreendimentos — um ficheiro JSON por projeto. O nome do ficheiro é o
 * endereço (/empreendimentos/<nome-do-ficheiro>) e, pelo CMS, fica fixo depois
 * de criado: é ele que o Google indexa e que liga as traduções (i18n).
 *
 * O schema é o contrato do "novo projeto": se faltar um campo obrigatório o
 * build falha com a mensagem do zod, em vez de publicar uma ficha partida.
 *
 * `estado`, `comercial` e `entrega` são opcionais DE PROPÓSITO: vazios, são
 * derivados da `grupo` (a fase) em src/utils/projetos.js — é isso que faz uma
 * mudança de fase ser uma única alteração. Preenchidos, são exceções (ex.:
 * vendido ainda em construção).
 */
export const FASES = ['futuro', 'desenvolvimento', 'concluido'] as const;
export const ESTADOS = ['Em projeto', 'Em construção', 'Concluído'] as const;

/** O CMS grava um campo opcional deixado vazio como "" — conta como ausente. */
const opcional = <T extends z.ZodTypeAny>(tipo: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), tipo.optional());

const empreendimentos = defineCollection({
  type: 'data',
  schema: z.object({
    nome: z.string().min(1),
    grupo: z.enum(FASES),
    ano: z.number().int(),
    localizacao: z.string().min(1),
    concelho: opcional(z.string()),
    tipologia: z.string().min(1),
    unidades: opcional(z.string()),
    estado: opcional(z.enum(ESTADOS)),
    comercial: opcional(z.string()),
    entrega: opcional(z.string()),
    resumo: z.string().min(1),
    imagem: opcional(z.string()),
    imagemReal: z.boolean().default(false),
    /** Desempate na ordenação: primeiro entre os projetos do mesmo ano. */
    destaque: z.boolean().default(false),
    galeria: z.array(z.string()).default([]).transform((l) => l.filter(Boolean)),
    // Linhas deixadas por preencher (o CMS sugere as habituais) não chegam à ficha.
    factos: z
      .array(z.object({ rotulo: z.string(), valor: z.string() }))
      .default([])
      .transform((l) => l.filter((f) => f.rotulo.trim() && f.valor.trim())),
  }),
});

export const collections = { blog, empreendimentos };
