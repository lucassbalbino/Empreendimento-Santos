# Transição de cortina entre páginas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao navegar entre páginas, a hero image da página de destino desce como cortina, cobre o ecrã, o DOM troca por baixo, e a nova página é revelada com o texto da hero a entrar depois.

**Architecture:** Astro `<ViewTransitions />` dá navegação suave (sem flash branco), lifecycle events e re-init de scripts. A cortina é um overlay `fixed` com `transition:persist` (sobrevive à troca de DOM), animado à mão via Web Animations API. A navegação é orquestrada manualmente com `navigate()` para termos controlo total do timing (descida → hold → swap → reveal).

**Tech Stack:** Astro 4.16, `astro:transitions` (`ViewTransitions`, `navigate`), Web Animations API, Lenis (já presente), CSS em `public/styles.css`.

## Global Constraints

- **Astro 4.16** → usar `<ViewTransitions />` de `astro:transitions` (NÃO `ClientRouter`, que é Astro 5).
- **CSS live** é `public/styles.css` (os ficheiros na raiz são mockup legado — não editar).
- **`prefers-reduced-motion: reduce`** → sem cortina, navegação direta. Vale para todas as tarefas.
- **Sem test runner** no repo. Verificação é no browser com `npm run dev` (porta default `http://localhost:4321`). Validar por **classe/comportamento e consola sem erros**, não por estilo computado.
- **Progressive enhancement:** sem JS, a navegação nativa dos `<a>` continua a funcionar.
- Timing default (ajustável no fim): descida 650ms, hold 120ms, reveal 600ms.

---

### Task 1: Navegação suave (ViewTransitions + prefetch)

Ativa a soft-navigation. Depois desta tarefa a navegação deixa de recarregar a página inteira. É esperado que Lenis/reveal/contadores fiquem "presos" a partir da 2ª página — isso é corrigido nas Tasks 2–4.

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/layouts/Base.astro:37-40` (head, junto ao `<link>` de estilos)

**Interfaces:**
- Produces: navegação suave ativa; eventos `astro:page-load` / `astro:before-swap` disponíveis; `navigate()` importável de `astro:transitions/client`.

- [ ] **Step 1: Ativar prefetch no config**

`astro.config.mjs` — substituir o conteúdo por:

```js
import { defineConfig } from 'astro/config';

// Site estático (mockup "Empresa Bela"). Prefetch mantém o HTML de destino
// em cache para a cortina ler a hero image sem espera.
export default defineConfig({
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
```

- [ ] **Step 2: Adicionar `<ViewTransitions />` ao head**

Em `src/layouts/Base.astro`, adicionar o import no frontmatter (topo, junto aos outros imports, linhas 1–3):

```astro
import { ViewTransitions } from 'astro:transitions';
```

E no `<head>`, logo a seguir a `<link rel="stylesheet" href="/styles.css">` (linha 40):

```astro
  <link rel="stylesheet" href="/styles.css">
  <ViewTransitions />
```

- [ ] **Step 3: Arrancar o dev server e verificar soft-nav**

Run: `npm run dev`
No browser, abrir `http://localhost:4321`, abrir DevTools → Network, clicar num link do menu (ex.: "Sobre Nós").
Expected: a página muda **sem** um novo pedido de documento top-level a recarregar tudo (o separador não "pisca" a branco); a Network mostra um fetch do HTML, não um full reload. Consola sem erros.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs src/layouts/Base.astro
git commit -m "feat: navegação suave entre páginas (ViewTransitions + prefetch)"
```

---

### Task 2: Re-inicializar o Lenis a cada navegação

Sem isto, a partir da 2ª página o scroll fica seco (sem interpolação) e o parallax da hero morre.

**Files:**
- Modify: `src/layouts/Base.astro:117-153` (o `<script>` de módulo do Lenis)

**Interfaces:**
- Consumes: evento `astro:page-load` (Task 1).
- Produces: instância única de Lenis reconstruída por página, guardada na closure do módulo.

- [ ] **Step 1: Substituir o script do Lenis**

Em `src/layouts/Base.astro`, substituir todo o bloco `<script>` do Lenis (o que começa com `import Lenis from 'lenis';`, linhas 117–153) por:

```astro
  <script>
    import Lenis from 'lenis';

    const DRIFT = 0.15;  // fração do scroll que a imagem da hero percorre
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scripts de módulo só correm UMA vez com ViewTransitions. Por isso o Lenis
    // é reconstruído a cada `astro:page-load` (dispara na 1.ª carga e em cada
    // navegação suave), destruindo a instância anterior — senão a partir da 2.ª
    // página o scroll fica seco e o parallax da hero congela.
    let lenis = null;
    let loopIniciado = false;

    function iniciarLenis() {
      if (lenis) { lenis.destroy(); lenis = null; }

      const bg = document.querySelector('.hero__bg--img');
      const hero = bg?.closest('.hero');
      const moverHero = (y) => {
        if (!hero || y > hero.offsetHeight) return;
        bg.style.setProperty('--hero-parallax', y * (1 - DRIFT) + 'px');
      };

      if (quieto) {
        document.documentElement.classList.add('sem-lenis');
        return;
      }
      document.documentElement.classList.remove('sem-lenis');

      lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        smoothWheel: true,
        syncTouch: false,
      });
      lenis.on('scroll', ({ scroll }) => moverHero(scroll));

      // Loop rAF único e permanente; lê sempre a instância atual (module-scope).
      if (!loopIniciado) {
        const frame = (t) => { if (lenis) lenis.raf(t); requestAnimationFrame(frame); };
        requestAnimationFrame(frame);
        loopIniciado = true;
      }
      moverHero(window.scrollY);
    }

    document.addEventListener('astro:page-load', iniciarLenis);
  </script>
```

- [ ] **Step 2: Verificar scroll e parallax após navegar**

Run: `npm run dev` (se não estiver já a correr)
No browser: abrir a home, navegar para "Sobre Nós", depois para "Portfólio". Em cada página, rolar com a roda do rato.
Expected: o scroll desliza (interpolado, não em saltos secos) em **todas** as páginas, não só na primeira. Na home, a imagem da hero faz parallax ao rolar. Consola sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "fix: reinicializar Lenis em cada navegação suave"
```

---

### Task 3: Re-inicializar o reveal-ao-rolar a cada navegação

Sem isto, a partir da 2ª página as secções não revelam (ficam no estado inicial escondido) — ou pior, ficam presas.

**Files:**
- Modify: `src/layouts/Base.astro:44-97` (o `<script is:inline>` do reveal)

**Interfaces:**
- Consumes: evento `astro:page-load` (Task 1).
- Produces: listeners globais (scroll/resize/pageshow/visibilitychange) ligados uma só vez; `setup()` re-corre por página, re-observando os elementos novos.

- [ ] **Step 1: Substituir o script inline do reveal**

Em `src/layouts/Base.astro`, substituir todo o bloco `<script is:inline>` do reveal (linhas 44–97, o comentário "Revelar-ao-rolar" fica por cima) por:

```astro
  <script is:inline>
    (function () {
      var root = document.documentElement;
      if (!('IntersectionObserver' in window) ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      root.classList.add('reveal-ready');
      var SEL = '.section, .section .display, .section .lead, .split__body > p, .card, .stat, .vertical, .service, .member, .panels, .reveal-wipe-lr, .reveal-rise-slow';
      var els = [];

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

      // Fail-safe: revela o que está no viewport mesmo com o IO suspenso (aba em
      // 2.º plano, bfcache, throttling). Lê sempre a lista `els` atual.
      function revealInView() {
        var vh = window.innerHeight || root.clientHeight;
        for (var j = 0; j < els.length; j++) {
          var el = els[j];
          if (el.classList.contains('is-visible')) continue;
          var r = el.getBoundingClientRect();
          if (r.top < vh * 0.92 && r.bottom > 0) { el.classList.add('is-visible'); io.unobserve(el); }
        }
      }
      var last = 0;
      function onScroll() {
        var now = Date.now();
        if (now - last < 100) return;
        last = now;
        revealInView();
      }

      // Globais UMA só vez (o script inline corre só uma vez).
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      window.addEventListener('pageshow', revealInView);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) revealInView();
      });

      // Por página: re-selecionar elementos novos, dar delay em cascata, observar.
      function setup() {
        els = Array.prototype.slice.call(document.querySelectorAll(SEL));
        els.forEach(function (el) {
          var sibs = el.parentNode ? el.parentNode.children : [el];
          var i = Array.prototype.indexOf.call(sibs, el);
          el.style.transitionDelay = (Math.min(i, 6) * 70) + 'ms';
          io.observe(el);
        });
        revealInView();
      }

      // `astro:page-load` dispara na 1.ª carga e em cada navegação suave.
      document.addEventListener('astro:page-load', setup);
    })();
  </script>
```

- [ ] **Step 2: Verificar reveal em páginas navegadas**

Run: `npm run dev`
No browser: home → "Histórico" → "Equipa". Em cada página rolar devagar.
Expected: as secções revelam (fade/rise) ao entrar no viewport em **todas** as páginas, não só na primeira. Nada fica preso escondido. Consola sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "fix: reinicializar reveal-ao-rolar em cada navegação suave"
```

---

### Task 4: Re-inicializar o main.js (header, menu, contadores)

Sem isto, a partir da 2ª página o header não muda ao rolar, o menu mobile não abre e os contadores não animam. O script `is:inline src` re-executa a cada troca de body — é preciso guardar contra binds duplicados.

**Files:**
- Modify: `public/main.js` (reescrita completa)

**Interfaces:**
- Consumes: evento `astro:page-load` (Task 1).
- Produces: `updateHeader()` / `bindMenu()` / `bindCounters()` chamados por página; listener de scroll global e binding de `astro:page-load` feitos uma só vez (guarda `window.__amsInit`).

- [ ] **Step 1: Reescrever `public/main.js`**

Substituir todo o conteúdo de `public/main.js` por:

```js
/* Interações do mockup — header on-scroll, menu mobile, contadores.
   Re-executa a cada navegação suave (ViewTransitions), por isso liga os
   globais uma só vez (guarda __amsInit) e refaz o setup por `astro:page-load`. */
(function () {
  if (window.__amsInit) return;   // script re-executa no soft-nav; ligar 1x
  window.__amsInit = true;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header muda ao rolar (listener global permanente).
  function updateHeader() {
    var header = document.querySelector('.site-header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 60);
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
    var nums = document.querySelectorAll('.stat__num[data-target]');
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
```

- [ ] **Step 2: Verificar header, menu e contadores após navegar**

Run: `npm run dev`
No browser: navegar home → "Sobre Nós" → home. Em cada página: rolar (o header deve ganhar a classe `scrolled` > 60px); estreitar a janela para mobile e abrir o menu (toggle); na home, rolar até aos contadores.
Expected: header muda ao rolar em todas as páginas; menu mobile abre/fecha; os contadores da home animam de 0 até ao valor ao entrarem no viewport (mesmo depois de navegar para fora e voltar). Consola sem erros.

- [ ] **Step 3: Commit**

```bash
git add public/main.js
git commit -m "fix: reinicializar interações (header/menu/contadores) no soft-nav"
```

---

### Task 5: Overlay da cortina (markup + CSS, estado escondido)

Cria o elemento persistente e os seus estilos, ainda sem lógica. No fim desta tarefa a cortina existe no DOM, está escondida, e sobrevive à navegação.

**Files:**
- Create: `src/components/PageCurtain.astro`
- Modify: `src/layouts/Base.astro:99-102` (incluir `<PageCurtain />` no body)
- Modify: `public/styles.css` (acrescentar bloco `.curtain` no fim)

**Interfaces:**
- Produces: `#page-curtain` (div `fixed`, `transition:persist="page-curtain"`) contendo `.curtain__img`; classes `.curtain--active` / `.curtain--solid`.

- [ ] **Step 1: Criar o componente da cortina (só markup)**

Criar `src/components/PageCurtain.astro`:

```astro
---
// Overlay que desce a cobrir o ecrã na troca de página. `transition:persist`
// mantém o MESMO elemento vivo através da troca de DOM, para a animação
// continuar por cima do swap. A lógica entra na Task 6.
---
<div id="page-curtain" class="curtain" aria-hidden="true" transition:persist="page-curtain">
  <div class="curtain__img"></div>
</div>
```

- [ ] **Step 2: Incluir a cortina no layout**

Em `src/layouts/Base.astro`, adicionar o import no frontmatter (junto aos outros, linhas 1–3):

```astro
import PageCurtain from '../components/PageCurtain.astro';
```

E no `<body>`, logo a seguir a `<Footer />` (linha 102):

```astro
  <Footer />
  <PageCurtain />
```

- [ ] **Step 3: Adicionar o CSS da cortina**

No fim de `public/styles.css`, acrescentar:

```css
/* ===== Cortina de transição entre páginas =====================================
   Overlay fixo que desce a cobrir o ecrã, troca o DOM por baixo, e revela.
   Repousa fora do ecrã (acima) e escondido; só fica visível durante a troca. */
.curtain {
  position: fixed;
  inset: 0;
  z-index: 9999;              /* acima do header e de tudo */
  transform: translateY(-100%);
  visibility: hidden;
  pointer-events: none;
  background: var(--dark);    /* fundo enquanto a imagem carrega / fallback */
  will-change: transform;
}
.curtain--active { visibility: visible; }
.curtain__img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
/* Sem imagem de destino: cortina sólida da marca. */
.curtain--solid .curtain__img { background: var(--dark); }

@media (prefers-reduced-motion: reduce) {
  .curtain { display: none; }  /* sem cortina; navegação direta */
}
```

- [ ] **Step 4: Verificar presença e persistência do overlay**

Run: `npm run dev`
No browser: abrir a home. Em DevTools → Elements, confirmar `<div id="page-curtain">` no fim do `<body>`. Está invisível (não cobre nada). Navegar para "Portfólio" e confirmar que o `#page-curtain` continua presente (não foi recriado/removido). Consola sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/PageCurtain.astro src/layouts/Base.astro public/styles.css
git commit -m "feat: overlay persistente da cortina de transição (markup + CSS)"
```

---

### Task 6: Orquestração da cortina (descida → cobrir → trocar → revelar)

O núcleo. Interceta cliques qualificados, pré-carrega a hero de destino, desce a cortina, troca a página coberta, e revela.

**Files:**
- Modify: `src/components/PageCurtain.astro` (adicionar `<script>`)

**Interfaces:**
- Consumes: `#page-curtain` / `.curtain__img` (Task 5); `navigate` de `astro:transitions/client`; evento `astro:page-load` (Task 1).
- Produces: handler de clique delegado que qualifica links (`.site-header a` ou `.btn` internos, sem `data-no-curtain`) e corre a sequência da cortina.

- [ ] **Step 1: Adicionar o script de orquestração**

No fim de `src/components/PageCurtain.astro` (depois do markup), adicionar:

```astro
<script>
  import { navigate } from 'astro:transitions/client';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DOWN = 650, HOLD = 120, UP = 600;
  const EASE = 'cubic-bezier(.7,0,.2,1)';

  const curtain = document.getElementById('page-curtain');
  const imgLayer = curtain.querySelector('.curtain__img');
  let busy = false;

  // Lê a URL da hero image do documento de destino (inline background-image).
  function heroUrlFromDoc(doc) {
    const bg = doc.querySelector('.hero__bg--img');
    if (!bg) return null;
    const s = bg.getAttribute('style') || '';
    const m = s.match(/url\((['"]?)(.*?)\1\)/);
    return m ? m[2] : null;
  }

  async function fetchDoc(href) {
    const res = await fetch(href, { headers: { Accept: 'text/html' } });
    const html = await res.text();
    return new DOMParser().parseFromString(html, 'text/html');
  }

  // Não bloquear para sempre se a imagem falhar/demorar.
  function preloadImg(url) {
    return new Promise((resolve) => {
      if (!url) return resolve();
      const im = new Image();
      im.onload = im.onerror = () => resolve();
      im.src = url;
      setTimeout(resolve, 1200);
    });
  }

  function slide(from, to, d) {
    return curtain.animate(
      [{ transform: `translateY(${from})` }, { transform: `translateY(${to})` }],
      { duration: d, easing: EASE, fill: 'forwards' }
    ).finished;
  }

  async function run(href) {
    if (busy) return;
    busy = true;

    let doc = null;
    try { doc = await fetchDoc(href); } catch (_) {}
    const url = doc ? heroUrlFromDoc(doc) : null;
    await preloadImg(url);

    imgLayer.style.backgroundImage = url ? `url("${url}")` : '';
    curtain.classList.toggle('curtain--solid', !url);
    curtain.classList.add('curtain--active');

    // Desce a cobrir, segura um instante no cover.
    await slide('-100%', '0', DOWN);
    await new Promise((r) => setTimeout(r, HOLD));

    // Troca a página POR BAIXO da cortina (coberta) e espera montar.
    const swapped = new Promise((resolve) => {
      const h = () => { document.removeEventListener('astro:page-load', h); resolve(); };
      document.addEventListener('astro:page-load', h);
    });
    navigate(href);
    await swapped;

    // Revela: a cortina sai por baixo, descobrindo a nova página (hero no topo).
    await slide('0', '100%', UP);
    curtain.classList.remove('curtain--active', 'curtain--solid');
    imgLayer.style.backgroundImage = '';
    busy = false;
  }

  // "Menu + botões principais": links do header OU .btn, internos, mesma origem.
  function qualifies(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('data-no-curtain')) return false;
    if (a.origin !== location.origin) return false;
    if (new URL(a.href).pathname === location.pathname) return false; // mesma página / âncora
    return !!a.closest('.site-header') || a.classList.contains('btn');
  }

  document.addEventListener('click', (e) => {
    if (reduce || e.defaultPrevented || e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || !qualifies(a)) return;
    e.preventDefault();
    run(a.href);
  });
</script>
```

- [ ] **Step 2: Verificar a transição de cortina completa**

Run: `npm run dev`
No browser (janela desktop): na home, clicar em "Sobre Nós" no menu.
Expected: a imagem da hero de "Sobre Nós" desce de cima a cobrir o ecrã, segura um instante, e depois sai por baixo revelando a página de "Sobre Nós" já montada com a hero no topo. Sem flash branco. Repetir com um botão `.btn` (ex.: na home, o botão "Sobre Nós" da secção "Quem Somos", e o "ver portfólio"). Clicar num link externo (SF Properties) → abre normal, sem cortina. Consola sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/PageCurtain.astro
git commit -m "feat: orquestração da cortina (descida, swap coberto, reveal)"
```

---

### Task 7: Texto da hero a entrar depois + polir reduced-motion

O texto da hero entra depois de a cortina assentar (fade + rise). Confirmar o fallback de reduced-motion.

**Files:**
- Modify: `src/components/PageCurtain.astro` (função de reveal do texto + chamada)

**Interfaces:**
- Consumes: `run()` e a fase de reveal (Task 6); `.hero .hero__inner` do documento novo.
- Produces: `revealHeroText()` chamado só quando a navegação foi por cortina.

- [ ] **Step 1: Adicionar o reveal do texto da hero**

Em `src/components/PageCurtain.astro`, dentro do `<script>`, adicionar a função (por exemplo a seguir a `slide`):

```js
  // Texto da hero entra depois de assentar — só na navegação por cortina, para
  // não afetar a 1.ª carga (onde a hero aparece normalmente).
  function revealHeroText() {
    const inner = document.querySelector('.hero .hero__inner');
    if (!inner) return;
    inner.animate(
      [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 600, easing: 'cubic-bezier(.2,.6,.2,1)', fill: 'backwards' }
    );
  }
```

- [ ] **Step 2: Chamar o reveal na fase de descoberta**

Em `run()`, dentro da fase de reveal, chamar `revealHeroText()` no momento em que a cortina começa a sair (para o texto surgir à medida que a hero se descobre). Substituir o bloco de reveal:

```js
    // Revela: a cortina sai por baixo, descobrindo a nova página (hero no topo).
    await slide('0', '100%', UP);
    curtain.classList.remove('curtain--active', 'curtain--solid');
    imgLayer.style.backgroundImage = '';
    busy = false;
```

por:

```js
    // Revela: a cortina sai por baixo e o texto da hero entra a acompanhar.
    revealHeroText();
    await slide('0', '100%', UP);
    curtain.classList.remove('curtain--active', 'curtain--solid');
    imgLayer.style.backgroundImage = '';
    busy = false;
```

- [ ] **Step 3: Verificar o texto e o reduced-motion**

Run: `npm run dev`
No browser: navegar via menu para "Equipa" e "Contactos". 
Expected: em cada uma, depois de a cortina assentar/sair, o título da hero surge com fade + subida (não estava lá durante a descida). Depois, nas DevTools → Rendering, ativar "Emulate CSS prefers-reduced-motion: reduce" e navegar de novo: **sem cortina**, a página troca de forma direta. Consola sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/PageCurtain.astro
git commit -m "feat: texto da hero entra após a cortina assentar + fallback reduced-motion"
```

---

## Notas de afinação (pós-implementação)

- **Timing:** ajustar `DOWN` / `HOLD` / `UP` em `PageCurtain.astro` ao gosto (ver referência do memory: fade rápido + movimento lento).
- **Duplo fetch:** `fetchDoc()` busca o HTML que o `navigate()` também busca; o prefetch dedupe torna-o barato. Se se quiser eliminar, ler a imagem em `astro:before-preparation` via `event` — mais complexo, deixado fora de âmbito.
- **`build`:** correr `npm run build` no fim para confirmar que compila sem erros antes de publicar.

## Self-Review

- **Cobertura do spec:** comportamento (T6+T7), alcance menu+botões (T6 `qualifies`), fallback reduced-motion (T5 CSS + T6/T7 guardas), sem-JS (nativo), abordagem A/ViewTransitions (T1), PageCurtain novo (T5/T6), estilos em styles.css (T5), pontos críticos Lenis+reveal (T2/T3) e o terceiro descoberto, main.js (T4). Coberto.
- **Placeholders:** nenhum; todo o código está presente.
- **Consistência de tipos/nomes:** `run()`, `qualifies()`, `slide()`, `revealHeroText()`, `#page-curtain`, `.curtain--active/--solid`, `iniciarLenis`, `setup`, `onPage` usados de forma coerente entre tarefas.
