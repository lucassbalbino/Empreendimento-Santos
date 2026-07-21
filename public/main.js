/* Interações do mockup — header on-scroll, menu mobile, contadores */
(function () {
  // Header muda ao rolar
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menu mobile
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('.nav__list a').forEach((a) =>
      a.addEventListener('click', () => nav.classList.remove('open'))
    );
  }

  // Animação dos contadores quando entram na viewport.
  // Count-up com IntersectionObserver + easing (ref.: CountUp.js, MDN
  // IntersectionObserver) e respeito por prefers-reduced-motion.
  const nums = document.querySelectorAll('.stat__num[data-target]');
  if (nums.length) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // pt-PT usa ponto como separador de milhares (185.000), essencial para os
    // valores de área lerem-se de relance.
    const fmt = (el, value) =>
      (el.dataset.prefix || '') +
      Math.round(value).toLocaleString('pt-PT') +
      (el.dataset.suffix || '');
    const animate = (el) => {
      const target = parseFloat(el.dataset.target) || 0;
      if (reduce) { el.textContent = fmt(el, target); return; }
      const dur = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = fmt(el, target * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    nums.forEach((n) => io.observe(n));
  }
})();
