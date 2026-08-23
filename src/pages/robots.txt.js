import seo from '../data/seo.json';

/**
 * robots.txt gerado no build para o domínio ficar sempre sincronizado com o
 * src/data/seo.json (um robots.txt estático com o domínio errado aponta o
 * Google para um sitemap que não existe).
 *
 * Os crawlers de IA entram de propósito na lista de permitidos: em 2026 uma
 * fatia das pesquisas de "construtora em Loures" é respondida dentro de um
 * assistente, e um bloqueio a GPTBot/ClaudeBot/PerplexityBot tira a AM Santos
 * dessas respostas sem lhe dar nada em troca. Se um dia isso mudar, é aqui.
 */
const dominio = seo.dominio.replace(/\/+$/, '');

const CRAWLERS_DE_IA = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
];

export function GET() {
  const linhas = [];

  if (seo.indexavel === false) {
    // Interruptor de segurança: enquanto o site for um mockup por publicar,
    // pôr `indexavel: false` no seo.json fecha-o inteiro à indexação.
    linhas.push('# Site fechado à indexação (seo.json: indexavel = false)');
    linhas.push('User-agent: *');
    linhas.push('Disallow: /');
  } else {
    linhas.push('User-agent: *');
    linhas.push('Allow: /');
    linhas.push('');
    linhas.push('# Painel de edição de conteúdo — não é conteúdo de site.');
    linhas.push('Disallow: /admin/');
    linhas.push('');
    linhas.push('# Assistentes de IA: permitidos de propósito (ver comentário no fonte).');
    for (const bot of CRAWLERS_DE_IA) {
      linhas.push(`User-agent: ${bot}`);
      linhas.push('Allow: /');
      linhas.push('Disallow: /admin/');
      linhas.push('');
    }
  }

  linhas.push(`Sitemap: ${dominio}/sitemap-index.xml`);
  linhas.push('');

  return new Response(linhas.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
