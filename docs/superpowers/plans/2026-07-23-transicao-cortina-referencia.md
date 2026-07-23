# Transição de abertura (réplica kononenkogroup) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicar a abertura da kononenkogroup no site AM Santos: preloader branco com contador na 1.ª carga, e cortina entre páginas que usa a hero image da página seguinte com wipe por `clip-path`.

**Architecture:** Mantém-se a infra existente (Astro ViewTransitions soft-nav, Lenis com reinit, reveal-ao-rolar). Só se altera o **movimento** da cortina (slide `translateY` → wipe `clip-path`) e adiciona-se um preloader novo (markup no layout + CSS + script inline gated por sessão). Sem dependências novas.

**Tech Stack:** Astro 4, Lenis, CSS live em `public/styles.css`, WAAPI (`Element.animate`) para a cortina, CSS transitions para o preloader.

## Global Constraints

- CSS live é `public/styles.css` — os ficheiros HTML na raiz do repo são mockup legado e não afetam o site.
- Easing "wipeFront" da referência = `cubic-bezier(0.8, 0, 0.2, 1)` — valor exato, usar verbatim.
- Reveal da cortina (valor real extraído): `clip-path: inset(0 0 0 0)` → `inset(0 0 100% 0)` (recolhe para cima).
- `prefers-reduced-motion: reduce` → sem preloader e sem cortina; navegação direta.
- Preloader só na 1.ª carga real; gate por `sessionStorage` (`ams-preloaded`).
- Verificação é visual no browser com a aba em **primeiro plano** (aba oculta suspende `requestAnimationFrame` e transições); validar por **classe/estado**, não por estilo computado.
- Camada WebGL da referência fica **fora de âmbito** — a imagem na troca vem de `background-image` no DOM da cortina.

---

### Task 1: Cortina — trocar movimento `translateY` por wipe `clip-path`

Substitui o slide vertical da cortina pelo wipe por `clip-path` da referência, mantendo a hero image de destino e toda a orquestração (fetch do doc, preload, swap coberto, failsafe, revealHeroText).

**Files:**
- Modify: `public/styles.css:1281-1290` (bloco `.curtain`)
- Modify: `src/components/PageCurtain.astro:17-18` (constantes `EASE`), `:50-55` (função `slide`), `:88` e `:108` (chamadas na `run`)

**Interfaces:**
- Consumes: nada de tarefas anteriores.
- Produces: `.curtain` passa a repousar com `clip-path: inset(100% 0 0 0)` (invisível); a cortina anima `clip-path` via WAAPI com ease `cubic-bezier(.8,0,.2,1)`.

- [ ] **Step 1: Alterar o CSS de `.curtain` para repousar por `clip-path`**

Em `public/styles.css`, substituir o bloco `.curtain { … }` (linhas ~1281-1290) por:

```css
.curtain {
  position: fixed;
  inset: 0;
  z-index: 9999;                  /* acima do header e de tudo */
  clip-path: inset(100% 0 0 0);   /* recolhida no fundo, invisível em repouso */
  visibility: hidden;
  pointer-events: none;
  background: var(--dark);        /* fundo enquanto a imagem carrega / fallback */
  will-change: clip-path;
}
```

(As regras `.curtain--active`, `.curtain__img`, `.curtain--solid` e o bloco `@media (prefers-reduced-motion)` mantêm-se inalteradas.)

- [ ] **Step 2: Trocar o easing na `PageCurtain.astro`**

Em `src/components/PageCurtain.astro`, substituir a linha da constante `EASE` (linha ~18):

```js
  const EASE = 'cubic-bezier(.8,0,.2,1)'; // "wipeFront" — valor exato da referência
```

- [ ] **Step 3: Substituir a função `slide` por `clipWipe`**

Substituir a função `slide` (linhas ~50-55) por:

```js
  // Estados de clip-path do wipe (inset top right bottom left):
  //  COVER_FROM: colada ao fundo, invisível → COVERED: tapa tudo → REVEALED: sai pelo topo.
  const COVER_FROM = 'inset(100% 0 0 0)';
  const COVERED    = 'inset(0 0 0 0)';
  const REVEALED   = 'inset(0 0 100% 0)';

  function clipWipe(from, to, d) {
    return curtain.animate(
      [{ clipPath: from }, { clipPath: to }],
      { duration: d, easing: EASE, fill: 'forwards' }
    ).finished;
  }
```

- [ ] **Step 4: Usar `clipWipe` nas fases cobrir/revelar da `run`**

Na função `run`, substituir a linha de cobertura (linha ~88):

```js
      // Cobre: a hero image de destino entra por wipe de baixo para cima até tapar.
      await clipWipe(COVER_FROM, COVERED, DOWN);
```

e a linha de revelação (linha ~108):

```js
      // Revela: a cortina continua o wipe para cima e sai pelo topo.
      await clipWipe(COVERED, REVEALED, UP);
```

(A animação de `opacity` da `imgLayer` nas linhas ~83-86 mantém-se: a imagem materializa-se enquanto o wipe sobe.)

- [ ] **Step 5: Verificar no browser**

Run: `npm run dev` e abrir `http://localhost:4321/` com a aba em primeiro plano.
Fazer: no browser, `sessionStorage.setItem('ams-preloaded','1')` (para saltar o preloader, ainda não implementado), depois clicar num link do header para outra página.
Esperado: a cortina cobre o ecrã com a **hero image da página de destino** por wipe de baixo para cima, troca por baixo, e revela a nova hero derretendo sem costura (a imagem coincide). Sem salto de `translateY`. Confirmar no DevTools que `#page-curtain` recebe `curtain--active` durante a troca e que o `clip-path` inline anima.

- [ ] **Step 6: Commit**

```bash
git add public/styles.css src/components/PageCurtain.astro
git commit -m "feat: cortina com wipe por clip-path (ease wipeFront da referência)"
```

---

### Task 2: Preloader — markup + CSS (branco, contador, barra, saída)

Adiciona o preloader ao layout e o seu CSS. Fica escondido por defeito (sem JS ou em soft-nav não aparece); a Task 3 liga-o na 1.ª carga.

**Files:**
- Modify: `src/layouts/Base.astro:106-107` (logo após `<body>`, antes de `<Header />`)
- Modify: `public/styles.css` (acrescentar bloco no fim, a seguir ao bloco da cortina, ~linha 1303)

**Interfaces:**
- Consumes: nada.
- Produces: elemento `#preloader` com `.preloader__bar` e `.preloader__num`; classes `html.is-loading` (mostra + trava scroll) e `.preloader--out` (wipe de saída) que a Task 3 vai togglar.

- [ ] **Step 1: Adicionar o markup do preloader no `Base.astro`**

Em `src/layouts/Base.astro`, imediatamente a seguir a `<body class={bodyClass}>` (linha ~106) e antes de `<Header />`:

```astro
  <div id="preloader" class="preloader" aria-hidden="true">
    <div class="preloader__bar"></div>
    <div class="preloader__count"><span class="preloader__num">0</span></div>
  </div>
```

- [ ] **Step 2: Adicionar o CSS do preloader**

Em `public/styles.css`, a seguir ao bloco da cortina (após a linha ~1303), acrescentar:

```css
/* ===== Preloader (só na 1.ª carga) ===========================================
   Escondido por defeito: sem JS, ou em navegação suave, não aparece. O script
   inline liga html.is-loading só na 1.ª carga real (ver Base.astro). */
.preloader {
  position: fixed;
  inset: 0;
  z-index: 10000;                 /* acima da cortina e do header */
  display: none;
  background: var(--paper);       /* branco/papel da marca */
  color: var(--ink);
  clip-path: inset(0 0 0 0);      /* base para a transição de saída animar */
  transition: clip-path .8s cubic-bezier(.8,0,.2,1);
  will-change: clip-path;
}
html.is-loading .preloader { display: block; }
html.is-loading { overflow: hidden; }   /* trava o scroll enquanto carrega */

.preloader__bar {
  position: absolute; top: 0; left: 0;
  height: 4px; width: 100%;
  background: var(--ink);
  transform: scaleX(0);
  transform-origin: left center;
  will-change: transform;
}
.preloader__count {
  position: absolute;
  left: clamp(16px, 4vw, 48px);
  bottom: clamp(12px, 3vh, 40px);
  font-size: clamp(3rem, 12vw, 9rem);
  line-height: .9;
  font-variant-numeric: tabular-nums;
}
/* Saída: wipe para cima, igual à cortina. */
.preloader--out { clip-path: inset(0 0 100% 0); }

@media (prefers-reduced-motion: reduce) {
  .preloader { display: none !important; }
}
```

- [ ] **Step 3: Verificar o layout do preloader**

Run: `npm run dev`, abrir `http://localhost:4321/`.
Fazer: no DevTools, adicionar a classe `is-loading` ao `<html>` manualmente.
Esperado: ecrã fica branco por cima de tudo; contador grande "0" no canto inferior-esquerdo; barra fina no topo (a `scaleX(0)` → invisível ainda). Remover a classe → o preloader desaparece. Sem a classe, não há flash de preloader ao carregar.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro public/styles.css
git commit -m "feat: markup e CSS do preloader (oculto por defeito)"
```

---

### Task 3: Preloader — contador, saída e gating de 1.ª carga

Liga o preloader só na 1.ª carga (gate por `sessionStorage` + reduced-motion), anima o contador `0→100` (sobe até 99, `window.load` leva a 100, teto de 2,5s), e sai com o wipe para cima.

**Files:**
- Modify: `src/layouts/Base.astro` — script inline no `<head>` (após `<link rel="stylesheet" href="/styles.css">`, linha ~42) e script inline no fim do `<body>` (antes de `<script is:inline src="/main.js"></script>`, linha ~210)

**Interfaces:**
- Consumes: `#preloader`, `.preloader__bar`, `.preloader__num`, classes `is-loading` e `preloader--out` (Task 2).
- Produces: comportamento completo do preloader; escreve `sessionStorage['ams-preloaded'] = '1'`.

- [ ] **Step 1: Adicionar o gate síncrono no `<head>`**

Em `src/layouts/Base.astro`, logo a seguir a `<link rel="stylesheet" href="/styles.css">` (linha ~42) e antes de `<ViewTransitions />`:

```astro
  <!-- Gate do preloader: liga is-loading ANTES do paint, só na 1.ª carga real
       (não em soft-nav nem com prefers-reduced-motion). Evita flash de conteúdo. -->
  <script is:inline>
    (function () {
      try {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var seen = sessionStorage.getItem('ams-preloaded');
        if (!reduce && !seen) document.documentElement.classList.add('is-loading');
      } catch (e) {}
    })();
  </script>
```

- [ ] **Step 2: Adicionar a lógica do contador no fim do `<body>`**

Em `src/layouts/Base.astro`, imediatamente antes de `<script is:inline src="/main.js"></script>` (linha ~210):

```astro
  <!-- Preloader: contador 0→100 (sobe até 99, window.load leva a 100, teto 2,5s)
       e saída por wipe para cima. Só corre se o gate ligou is-loading. -->
  <script is:inline>
    (function () {
      var root = document.documentElement;
      if (!root.classList.contains('is-loading')) return;  // não é 1.ª carga / reduced-motion
      var pre = document.getElementById('preloader');
      if (!pre) { root.classList.remove('is-loading'); return; }
      var bar = pre.querySelector('.preloader__bar');
      var num = pre.querySelector('.preloader__num');

      var shown = 0, target = 0, loaded = false, raf, ended = false;
      var t0 = Date.now();

      function complete() { loaded = true; target = 100; }

      function tick() {
        var elapsed = Date.now() - t0;
        if (!loaded) {
          var ramp = Math.min(99, (elapsed / 1200) * 99);  // sobe até 99 em ~1,2s
          if (ramp > target) target = ramp;
        }
        shown += (target - shown) * 0.12;                  // easing suave até ao alvo
        var v = Math.min(100, Math.round(shown));
        if (num) num.textContent = v;
        if (bar) bar.style.transform = 'scaleX(' + (v / 100) + ')';
        if (target >= 100 && v >= 100) { finish(); return; }
        raf = requestAnimationFrame(tick);
      }

      function finish() {
        if (ended) return; ended = true;
        cancelAnimationFrame(raf);
        pre.classList.add('preloader--out');               // wipe para cima (CSS transition)
        try { sessionStorage.setItem('ams-preloaded', '1'); } catch (e) {}
        setTimeout(function () {
          root.classList.remove('is-loading');             // destrava o scroll
          pre.remove();
        }, 800);                                            // = duração da transição
      }

      if (document.readyState === 'complete') complete();
      else window.addEventListener('load', complete);
      setTimeout(complete, 2500);                           // teto: nunca ficar preso
      raf = requestAnimationFrame(tick);
    })();
  </script>
```

- [ ] **Step 3: Verificar a 1.ª carga**

Run: `npm run dev`, abrir `http://localhost:4321/` com a aba em **primeiro plano**.
Fazer: no browser, `sessionStorage.removeItem('ams-preloaded')` e recarregar.
Esperado: ecrã branco; contador sobe `0→100`; barra do topo enche da esquerda; ao chegar a 100 o branco faz wipe para cima e revela a hero (com o reveal de baixo para cima existente). Confirmar por classe: `<html>` tem `is-loading` durante, `#preloader` ganha `preloader--out`, e no fim `is-loading` sai e `#preloader` desaparece do DOM. Scroll travado durante o preloader.

- [ ] **Step 4: Verificar que não repete e respeita reduced-motion**

Fazer: sem limpar o `sessionStorage`, navegar por um link do header para outra página e voltar.
Esperado: **sem** preloader nas navegações seguintes (só a cortina da Task 1). Depois, no DevTools, ativar "Emulate prefers-reduced-motion: reduce", limpar `sessionStorage` e recarregar.
Esperado: **sem** preloader e **sem** cortina — navegação direta.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: contador e gating do preloader (1.ª carga, window.load, teto 2,5s)"
```

---

### Task 4: Congelar o scroll (Lenis) durante a cortina

Expõe a instância do Lenis e para/retoma o scroll à volta do wipe, como a referência (`lenis.stop()` antes de cobrir, `lenis.start()` depois de revelar).

**Files:**
- Modify: `src/layouts/Base.astro:190-206` (função `iniciarLenis`, expor a instância)
- Modify: `src/components/PageCurtain.astro` (função `run`, à volta das chamadas `clipWipe`)

**Interfaces:**
- Consumes: `clipWipe`, `COVER_FROM`, `COVERED`, `REVEALED` (Task 1); `window.__amsLenis` (este passo).
- Produces: `window.__amsLenis` — a instância Lenis atual (ou `undefined` em reduced-motion), reatribuída a cada `astro:page-load`.

- [ ] **Step 1: Expor a instância do Lenis em `window`**

Em `src/layouts/Base.astro`, dentro de `iniciarLenis`, logo após `lenis = new Lenis({ … });` (linha ~196) e antes de `lenis.on('scroll', …)`:

```js
      window.__amsLenis = lenis;
```

E no início de `iniciarLenis`, no ramo `if (quieto) { … }` (linha ~184), antes do `return`, garantir que fica limpo:

```js
      if (quieto) {
        document.documentElement.classList.add('sem-lenis');
        window.__amsLenis = undefined;
        return;
      }
```

- [ ] **Step 2: Parar/retomar o Lenis à volta do wipe**

Em `src/components/PageCurtain.astro`, na função `run`, imediatamente antes da chamada de cobertura `await clipWipe(COVER_FROM, COVERED, DOWN);`:

```js
      window.__amsLenis?.stop();
```

E imediatamente depois da chamada de revelação `await clipWipe(COVERED, REVEALED, UP);`:

```js
      // Depois do swap já existe uma instância NOVA do Lenis (recriada no
      // astro:page-load); retomamos essa.
      window.__amsLenis?.start();
```

- [ ] **Step 3: Verificar**

Run: `npm run dev`, abrir `http://localhost:4321/` (com `sessionStorage.setItem('ams-preloaded','1')` para saltar o preloader).
Fazer: clicar num link do header e tentar rolar com a roda do rato durante a cortina.
Esperado: o scroll está congelado enquanto a cortina cobre/revela; depois de revelar, o scroll suave (Lenis) volta a funcionar na página nova. Confirmar `window.__amsLenis` definido na consola após a navegação.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro src/components/PageCurtain.astro
git commit -m "feat: congelar Lenis durante a cortina (stop/start à volta do wipe)"
```

---

## Notas de verificação final (contra a referência)

- Afinar `DOWN`/`UP` (cortina, em `PageCurtain.astro`) e a duração da transição do preloader (`0.8s` em CSS + o `setTimeout(...,800)`) lado a lado com https://kononenkogroup.com/work/ num browser normal. Se mudares a duração da saída do preloader, muda os **três** sítios juntos (CSS `.preloader` transition, e o `800` no `finish`).
- Manter a aba em primeiro plano ao validar: em 2.º plano o `requestAnimationFrame` do contador e as transições ficam suspensos.
