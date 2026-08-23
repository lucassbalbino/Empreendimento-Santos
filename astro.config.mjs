import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import seo from './src/data/seo.json';

// Site estático (mockup "Empresa Bela"). Prefetch mantém o HTML de destino
// em cache para a cortina ler a hero image sem espera.
export default defineConfig({
  // `site` é obrigatório para o sitemap e é o que dá URLs absolutas ao build.
  // O valor vem do src/data/seo.json — mudar o domínio num sítio só.
  site: seo.dominio,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      // A 404 não se indexa; não tem nada que fazer num sitemap.
      filter: (url) => !url.includes('/404'),

      // O build gera pastas (`/portfolio/index.html`), por isso o URL servido
      // tem barra final e é essa a canonical. Um sitemap sem barra apontaria
      // para o URL "errado" e o Google trataria os dois como duplicados.
      serialize(item) {
        if (!/\.[a-z0-9]{2,5}$/i.test(item.url) && !item.url.endsWith('/')) {
          item.url += '/';
        }

        // Prioridades: a home e as duas listagens de empreendimentos são as
        // portas de entrada orgânicas; as fichas de empreendimento são o
        // conteúdo que responde às pesquisas de cauda longa.
        const caminho = new URL(item.url).pathname;
        if (caminho === '/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (caminho === '/portfolio/' || caminho === '/historico/') {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        } else if (caminho.startsWith('/empreendimentos/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (caminho.startsWith('/blog/')) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],
});
