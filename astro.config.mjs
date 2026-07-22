import { defineConfig } from 'astro/config';

// Site estático (mockup "Empresa Bela"). Prefetch mantém o HTML de destino
// em cache para a cortina ler a hero image sem espera.
export default defineConfig({
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
