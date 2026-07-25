// Split-text por linha (line-mask reveal), em todo o texto de secção do site.
// Cada elemento é partido por linha (split-type); cada linha é envolvida numa
// .line__inner que sobe de baixo de uma máscara (.line, overflow:hidden) ao
// entrar em vista, com gatilho tardio. Corre por astro:page-load (1.ª carga +
// soft-nav) e re-parte no resize. Gated por reduced-motion + IntersectionObserver;
// se não correr, o texto fica legível (progressive enhancement).
import SplitType from 'split-type';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce && 'IntersectionObserver' in window) init();

function init() {
  // Exatamente os seletores libertados do block-reveal (texto de secção). Exclui
  // a hero (.hero, não .section) e os cards (não têm .eyebrow/.display/.lead nem
  // .split__body>p / .quemsomos__intro>p).
  const SEL = '.section .eyebrow, .section .display, .section .lead, .split__body > p, .quemsomos__intro > p';
  const REVEAL_MARGIN = '0px 0px -25% 0px'; // tardio: só quando bem dentro do ecrã
  const instances = []; // { el, split }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0, rootMargin: REVEAL_MARGIN });

  function reveal(el) { el.classList.add('is-revealed'); }

  // Parte um elemento em linhas e envolve cada linha numa .line__inner (a peça
  // que translada; a .line clipa). Indexa cada uma para o stagger.
  function splitOne(el) {
    const split = new SplitType(el, { types: 'lines' });
    split.lines.forEach((line, i) => {
      const inner = document.createElement('span');
      inner.className = 'line__inner';
      inner.style.setProperty('--i', i);
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
    });
    el.classList.add('split-ready');
    return split;
  }

  function build() {
    document.querySelectorAll(SEL).forEach((el) => {
      const split = splitOne(el);
      instances.push({ el, split });
      io.observe(el);
    });
  }

  function teardown() {
    instances.forEach(({ el, split }) => {
      io.unobserve(el);
      try { split.revert(); } catch (_) {}
      el.classList.remove('split-ready', 'is-revealed');
    });
    instances.length = 0;
  }

  // Re-parte a cada página (soft-nav): o DOM é novo. Espera as fontes para medir
  // as quebras de linha certas (sem re-medição/flash).
  document.addEventListener('astro:page-load', () => {
    teardown();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    else build();
  });
}
