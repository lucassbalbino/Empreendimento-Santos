/* Interações do mockup — header on-scroll, menu mobile, contadores.
   Re-executa a cada navegação suave (ViewTransitions), por isso liga os
   globais uma só vez (guarda __amsInit) e refaz o setup por `astro:page-load`. */
(function () {
  if (window.__amsInit) return;   // script re-executa no soft-nav; ligar 1x
  window.__amsInit = true;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header muda ao rolar (listener global permanente).
  var lastScrollY = window.scrollY;
  function updateHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var scrollY = window.scrollY;
    // Páginas sem hero (body.no-hero) nascem com o header sólido: sem imagem
    // escura por baixo, o estado transparente/logo-claro ficaria ilegível.
    header.classList.toggle('scrolled', document.body.classList.contains('no-hero') || scrollY > 60);

    // Esconde ao rolar para baixo, mostra ao rolar para cima. Só some depois
    // de um limiar para não oscilar logo no topo; menu mobile aberto nunca esconde.
    var nav = document.querySelector('.nav');
    var menuOpen = nav && nav.classList.contains('open');
    if (!menuOpen) {
      header.classList.toggle('site-header--hidden', scrollY > lastScrollY && scrollY > 120);
    }
    lastScrollY = scrollY;
  }
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Menu mobile — liga por elemento, evitando duplicar em elementos já ligados.
  function bindMenu() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.nav');
    if (toggle && nav && !toggle.dataset.bound) {
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
      nav.querySelectorAll('.nav__list a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('open'); });
      });
    }
  }

  // pt-PT usa ponto como separador de milhares (185.000).
  function fmt(el, value) {
    return (el.dataset.prefix || '') +
      Math.round(value).toLocaleString('pt-PT') +
      (el.dataset.suffix || '');
  }
  function animate(el) {
    var target = parseFloat(el.dataset.target) || 0;
    if (reduce) { el.textContent = fmt(el, target); return; }
    var dur = 1600;
    var start = performance.now();
    var step = function (now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(el, target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  // Contadores: IO novo por página (os elementos são novos após a troca).
  function bindCounters() {
    // .fact__v: contadores da home, que usam a grelha da ficha (.facts/.fact).
    var nums = document.querySelectorAll('.stat__num[data-target], .fact__v[data-target]');
    if (!nums.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  function onPage() { updateHeader(); bindMenu(); bindCounters(); }
  // Dispara na 1.ª carga e em cada navegação suave.
  document.addEventListener('astro:page-load', onPage);
})();
