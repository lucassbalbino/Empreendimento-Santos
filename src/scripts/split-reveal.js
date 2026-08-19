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
  // a hero (.hero, não .section) — já tem a sua própria entrada, coreografada
  // com o preloader/cortina — e os cards de projeto (carrossel com a sua
  // própria animação).
  // .quemsomos__p / .dofazemos__lead / .pilar__x — os parágrafos editoriais do
  // "Quem Somos" e "O Que Fazemos" (home), no mesmo idioma do site de
  // referência (kononenkogroup): texto que sobe linha a linha ao entrar no ecrã.
  // .title-split__text — o texto de qualquer título TitleSplit dentro de uma
  // .section (em todo o site); o span é filho de um flex container
  // (.title-split), por isso já é "blockificado" e aceita as .line que o
  // split-type insere sem quebrar o layout.
  // .qmeta__v/__l — os itens da meta do "Quem Somos" (valor + rótulo).
  // .muted — parágrafo secundário do contacto (ContactForm) e da página de
  // contactos.
  // .display saiu do seletor: a classe tem zero ocorrências em src/ desde que
  // o BlockHead passou a emitir .title-split. Ficava aqui a apanhar nada.
  const SEL = '.section .lead, .split__body > p, .quemsomos__intro > p, ' +
    '.quemsomos__p, .dofazemos__lead, .pilar__x, ' +
    '.section .title-split__text, ' +
    '.qmeta__v, .qmeta__l, .section .muted';
  // O bloco de abertura de /portfolio e /historico fica FORA deste sistema: o
  // título e o lead têm entrada própria, coreografada com a cortina e disparada
  // pela classe .is-entered (ver "h1 do 1.º bloco" em styles.css). O portão põe
  // opacity:0 !important no elemento inteiro, por isso qualquer animação de
  // linhas por baixo corria mascarada — trabalho perdido e duas animações a
  // competir pelo mesmo elemento.
  const FORA = '.section--flat-top .block-head';
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
      if (el.closest(FORA)) return;
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

  // Reconstrói a partir de um conjunto de elementos já revelados (capturado
  // ANTES do teardown — ver comentário em __amsSplitReveal.snapshot): repõe
  // .is-revealed sem re-animar (via .split-instant) nos que já lá estavam,
  // observa os restantes para revelar ao entrar em vista.
  function rebuildFrom(revealed) {
    document.querySelectorAll(SEL).forEach((el) => {
      if (el.closest(FORA)) return;
      const split = splitOne(el);
      instances.push({ el, split });
      if (revealed.has(el)) {
        el.classList.add('split-instant');
        void el.offsetHeight;                 // reflow: fixa o estado escondido
        el.classList.add('is-revealed');
        requestAnimationFrame(() => el.classList.remove('split-instant'));
      } else {
        io.observe(el);
      }
    });
  }

  function rebuildPreservingReveal() {
    const revealed = new Set(
      instances.filter((x) => x.el.classList.contains('is-revealed')).map((x) => x.el)
    );
    teardown();
    rebuildFrom(revealed);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuildPreservingReveal, 150);
  }, { passive: true });

  // API para o motor de i18n (main.js). split.revert() (dentro de teardown)
  // restaura o HTML ORIGINAL guardado numa cache interna do SplitType — por
  // isso o texto traduzido só pode ser escrito nos elementos DEPOIS do
  // teardown() correr (elementos ficam em texto simples, seguros para
  // sobrescrever) e ANTES do rebuild() dividir de novo (que lê o texto então
  // presente nos elementos como nova base).
  window.__amsSplitReveal = {
    snapshotAndTeardown() {
      const revealed = new Set(
        instances.filter((x) => x.el.classList.contains('is-revealed')).map((x) => x.el)
      );
      teardown();
      return revealed;
    },
    rebuild: rebuildFrom,
  };

  // Fail-safe por scroll: se o IO estiver suspenso, revela o que já passou o
  // limiar tardio (top a ~75% da altura, a condizer com o rootMargin -25%).
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScroll < 120) return;
    lastScroll = now;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    instances.forEach(({ el }) => {
      if (el.classList.contains('is-revealed')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.75 && r.bottom > 0) { reveal(el); io.unobserve(el); }
    });
  }, { passive: true });

  // Re-parte a cada página (soft-nav): o DOM é novo. Espera as fontes para medir
  // as quebras de linha certas (sem re-medição/flash).
  document.addEventListener('astro:page-load', () => {
    teardown();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    else build();
  });
}
