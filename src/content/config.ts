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

export const collections = { blog };
