# Como Trabalhamos — half-grid parallax + parágrafo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3-card "verticais" grid in `sobre-nos.astro`'s "Como trabalhamos" section with a two-half layout: a masonry parallax image grid (5 empreendimento photos, two columns moving at different scroll speeds) on one side, and a single flowing paragraph merging the old vertical copy with 3 counter figures on the other.

**Architecture:** Static Astro content (`sobre.json`) feeds a new markup block in `sobre-nos.astro`, styled by new CSS in `public/styles.css`, animated by a new Lenis-driven parallax function in `src/layouts/Base.astro` that mirrors the existing `moverQuem`/`--qs-parallax` pattern but drives two independent columns.

**Tech Stack:** Astro 4, vanilla CSS (`public/styles.css` is the live stylesheet — do not touch the legacy root HTML mockup files), Lenis (`^1.3.25`) for scroll-driven parallax, no test framework (this is a static-content/visual project — verification is `astro build` + manual browser check per project convention).

## Global Constraints

- CSS edits go in `public/styles.css` — editing files at the project root does nothing on the live site ([[live-css-is-public-styles]]).
- Parallax elements need `overflow:clip`, never `overflow:hidden` — `hidden` turns the wrapper into a scroll container and breaks `view()`/scroll-driven timing ([[view-timeline-overflow-clip]]).
- The reveal system (`Base.astro`) writes `transition-delay` inline per revealable element and gates initial hidden-state via `html.reveal-ready` — don't fight it with competing `transition` shorthand overrides.
- No Playwright/Vitest/etc. in this repo. "Testing" a step means: `npm run build` succeeds, and (for visual steps) checking the rendered page with the `run` skill / browser tool.
- Portuguese copy, matching the tone already in `sobre.json` (formal, first-person-plural "nossa/nós").

---

### Task 1: Update `sobre.json` — replace `verticais` with `imagens` + `paragrafo`

**Files:**
- Modify: `src/data/sobre.json:13-32` (the `oQueFazemos` block)

**Interfaces:**
- Produces: `sobre.oQueFazemos.imagens` = `{ colunaA: string[3], colunaB: string[2] }` (each entry an absolute `/images/...` path); `sobre.oQueFazemos.paragrafo` = string with `**...**` markers around the 3 numeric phrases to highlight. Consumed by Task 2.

- [ ] **Step 1: Edit the JSON**

Replace lines 13-32 of `src/data/sobre.json` (the whole `"oQueFazemos": { ... }` object) with:

```json
  "oQueFazemos": {
    "title": "Do conceito\nà entrega da chave",
    "imagens": {
      "colunaA": [
        "/images/empreendimentos/valflores-terraces.webp",
        "/images/empreendimentos/valflores-terraces-aerea.webp",
        "/images/empreendimentos/interior-1.webp"
      ],
      "colunaB": [
        "/images/empreendimentos/clt-tojal.webp",
        "/images/empreendimentos/interior-2.webp"
      ]
    },
    "paragrafo": "A excelência em cada um dos **17 projetos** que já executámos é o que nos distingue — do primeiro traço ao último acabamento, com uma equipa de alto nível em arquitetura, engenharia, decoração e gestão imobiliária a acompanhar cada fase. Projetamos para quem lá vai viver: arquitetura moderna e funcional, com foco no bem-estar e no máximo conforto climático, já concretizada em **185.000 m² de construção**. Fazemo-lo com uma abordagem eco-friendly e materiais sustentáveis que reduzem os custos de manutenção ao longo da vida do edifício — sustentada por **95 milhões de euros investidos** ao longo do nosso percurso."
  },
```

Keep every other top-level key in `sobre.json` (`hero`, `quemSomos`, `servicos`, `equipa`, `contacto`) untouched.

- [ ] **Step 2: Verify the JSON parses**

Run:
```bash
node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('src/data/sobre.json','utf8')).oQueFazemos))"
```
Expected output: `[ 'title', 'imagens', 'paragrafo' ]`

- [ ] **Step 3: Confirm the referenced image files exist**

Run:
```bash
node -e "
const fs=require('fs');
const paths=['valflores-terraces.webp','valflores-terraces-aerea.webp','interior-1.webp','clt-tojal.webp','interior-2.webp'];
for (const p of paths) console.log(p, fs.existsSync('public/images/empreendimentos/'+p));
"
```
Expected: all five print `true`. If any is `false`, check the exact filename in `src/data/empreendimentos.json` (grep `"imagem":`) and fix the path in Step 1 before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/data/sobre.json
git commit -m "feat: dados da grelha de imagens e parágrafo em Como Trabalhamos"
```

---

### Task 2: Rewrite the section markup in `sobre-nos.astro`

**Files:**
- Modify: `src/pages/sobre-nos.astro:11` (frontmatter) and `:50-66` (the "O QUE FAZEMOS — VERTICAIS" section)

**Interfaces:**
- Consumes: `sobre.oQueFazemos.imagens.colunaA/colunaB` (string[]), `sobre.oQueFazemos.paragrafo` (string with `**..**` markers) from Task 1.
- Produces: markup with classes `.comotrabalhamos`, `.comotrabalhamos__grid`, `.comotrabalhamos__col--a`, `.comotrabalhamos__col--b` consumed by Task 3 (CSS) and Task 4 (JS parallax selectors must match exactly).

- [ ] **Step 1: Update the frontmatter title-processing line**

In `src/pages/sobre-nos.astro`, line 11 currently reads:

```astro
const fazemosTitle = sobre.oQueFazemos.title.replace(/\n/g, '<br>');
```

Leave that line as-is, and add a new line right after it:

```astro
const fazemosTitle = sobre.oQueFazemos.title.replace(/\n/g, '<br>');
const fazemosParagrafo = sobre.oQueFazemos.paragrafo.replace(/\*\*(.*?)\*\*/g, '<em class="comotrabalhamos__num">$1</em>');
```

- [ ] **Step 2: Replace the section markup**

Replace the block at lines 50-66:

```astro
  <!-- O QUE FAZEMOS — VERTICAIS -->
  <section class="section section--alt">
    <div class="container has-wm">
      <Watermark variant="line" side="r" size="md" y="top" />
      <h2 class="display display--sm" set:html={fazemosTitle}></h2>
      <div class="verticals">
        {sobre.oQueFazemos.verticais.map((v) => (
          <div class="vertical">
            <div class="vertical__n">{v.n}</div>
            <h3>{v.title}</h3>
            <p>{v.texto}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
```

with:

```astro
  <!-- O QUE FAZEMOS — grelha de imagens em parallax + parágrafo -->
  <section class="section section--alt">
    <div class="container has-wm">
      <Watermark variant="line" side="r" size="md" y="top" />
      <div class="split comotrabalhamos">
        <div class="comotrabalhamos__grid">
          <div class="comotrabalhamos__col comotrabalhamos__col--a">
            {sobre.oQueFazemos.imagens.colunaA.map((src) => (
              <img src={src} alt="Empreendimento AM Santos" loading="lazy" />
            ))}
          </div>
          <div class="comotrabalhamos__col comotrabalhamos__col--b">
            {sobre.oQueFazemos.imagens.colunaB.map((src) => (
              <img src={src} alt="Empreendimento AM Santos" loading="lazy" />
            ))}
          </div>
        </div>
        <div class="split__body">
          <h2 class="display display--sm" set:html={fazemosTitle}></h2>
          <p class="comotrabalhamos__paragrafo" set:html={fazemosParagrafo}></p>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 3: Build to catch template errors**

Run: `npm run build`
Expected: build succeeds with no errors referencing `sobre-nos.astro` or `sobre.json`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/sobre-nos.astro
git commit -m "feat: half-grid de imagens + parágrafo em Como Trabalhamos"
```

---

### Task 3: CSS — masonry grid, parallax base styles, paragraph highlight, remove unused `.verticals`

**Files:**
- Modify: `public/styles.css:715-724` (remove the now-unused "VERTICAIS" block)
- Modify: `public/styles.css` (add new "COMO TRABALHAMOS" block — insert after the removed block, same location)
- Modify: `public/styles.css:803-817` (reveal `:is(...)` selector list — swap `.vertical` for `.comotrabalhamos__paragrafo`)

**Interfaces:**
- Consumes: class names from Task 2 (`.comotrabalhamos`, `.comotrabalhamos__grid`, `.comotrabalhamos__col--a/--b`, `.comotrabalhamos__num`, `.comotrabalhamos__paragrafo`).
- Produces: CSS custom properties `--ct-parallax-a` / `--ct-parallax-b` (read by inline `transform`), which Task 4's JS must write via `element.style.setProperty(...)`.

- [ ] **Step 1: Remove the unused VERTICAIS block**

Delete lines 715-724 of `public/styles.css` (the `/* VERTICAIS ... */` comment header through `.vertical p{...}`), i.e. everything shown in the Task-planning read above:

```css

/* =====================================================================
   VERTICAIS (3 áreas de atuação — Sobre Nós)
   ===================================================================== */
.verticals{ display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border-block:1px solid var(--line); margin-top:clamp(40px,5vw,70px); }
.vertical{ background:var(--paper); padding:clamp(28px,3vw,46px); }
.section--alt .vertical{ background:var(--paper-alt); }
.vertical__n{ font-family:var(--serif); font-size:1rem; color:var(--accent); }
.vertical h3{ font-family:var(--serif); font-weight:400; font-size:1.6rem; margin:.6rem 0 1rem; }
.vertical p{ color:var(--ink-soft); font-size:.95rem; }
```

- [ ] **Step 2: Add the new "COMO TRABALHAMOS" CSS block**

In its place, add:

```css

/* =====================================================================
   COMO TRABALHAMOS — grelha de imagens em parallax (masonry, 2 colunas a
   velocidades diferentes) + parágrafo com os contadores embutidos
   (Sobre Nós). Substitui as antigas "verticais".
   ===================================================================== */
.comotrabalhamos__grid{
  position:relative;
  aspect-ratio:4/5;
  overflow:clip;   /* clip, não hidden: não criar scroll container que prenda o parallax */
}
.comotrabalhamos__col{
  position:absolute;
  width:47%;
  display:flex;
  flex-direction:column;
  gap:clamp(10px,1.4vw,18px);
  will-change:transform;
}
/* Desfasamento vertical entre colunas: dá o efeito masonry. */
.comotrabalhamos__col--a{
  left:0; top:-6%;
  transform:translate3d(0, var(--ct-parallax-a, 0px), 0);
}
.comotrabalhamos__col--b{
  right:0; top:9%;
  transform:translate3d(0, var(--ct-parallax-b, 0px), 0);
}
.comotrabalhamos__col img{
  width:100%; display:block;
  aspect-ratio:3/4; object-fit:cover;
}

.comotrabalhamos__paragrafo{
  margin-top:1.2rem;
  color:var(--ink-soft);
}
/* Números embutidos no texto corrido, sem contador animado — mesma técnica
   de destaque que .dofazemos .display em (cor da marca, sem itálico). */
.comotrabalhamos__num{
  font-style:normal;
  font-weight:600;
  color:var(--accent);
}
```

- [ ] **Step 3: Swap `.vertical` for `.comotrabalhamos__paragrafo` in the reveal selector list**

At (now-shifted, re-check with grep) lines matching `html.reveal-ready :is(` — there are two occurrences, both currently:

```css
html.reveal-ready :is(
  .card, .stat, .vertical, .service, .member, .panels
){
```
and
```css
html.reveal-ready :is(
  .card, .stat, .vertical, .service, .member, .panels
).is-visible{
```

Replace `.vertical` with `.comotrabalhamos__paragrafo` in **both** occurrences (use a project-wide search for `, .vertical,` in `public/styles.css` to find them exactly, since line numbers shift after Step 1's deletion).

- [ ] **Step 4: Add mobile stacking for the new grid**

Find the existing mobile media query in `public/styles.css`:

```css
@media (max-width: 760px){
  .split, .service, .contact{ grid-template-columns:1fr; }
```

`.comotrabalhamos` already inherits the single-column stack because it carries the `.split` class from Task 2's markup — no change needed here. Just confirm this by reading the block after your edits (`grep -n "max-width: 760px" -A3 public/styles.css`) and note in your commit message that no further mobile rule was required.

- [ ] **Step 5: Build and visually sanity-check**

Run: `npm run build`
Expected: succeeds, no CSS-related errors (Astro doesn't lint CSS, but confirm no broken references by grepping the build output directory for the new class names):
```bash
grep -rl "comotrabalhamos" dist/ | head -5
```
Expected: at least one file under `dist/` (the built `sobre-nos/index.html` or similar) contains the class name.

- [ ] **Step 6: Commit**

```bash
git add public/styles.css
git commit -m "style: grelha masonry em parallax e parágrafo de Como Trabalhamos"
```

---

### Task 4: Base.astro — two-column parallax driver

**Files:**
- Modify: `src/layouts/Base.astro` (the Lenis `<script>` block containing `moverHero`/`moverQuem`, around lines 159-238 per the current file)

**Interfaces:**
- Consumes: DOM classes `.comotrabalhamos__grid`, `.comotrabalhamos__col--a`, `.comotrabalhamos__col--b` from Task 2; CSS custom properties `--ct-parallax-a`/`--ct-parallax-b` declared in Task 3.
- Produces: nothing consumed by later tasks — this is the last task.

- [ ] **Step 1: Add the mover function**

In `src/layouts/Base.astro`, immediately after the existing `moverQuem` function definition (right after its closing `};` — the block that ends `qsImg.style.setProperty('--qs-parallax', off.toFixed(1) + 'px');\n      };`), add:

```js
      // "Como trabalhamos" (Sobre Nós): grelha masonry de 2 colunas, cada
      // uma a deslocar-se a uma fração diferente da distância ao centro do
      // ecrã — mesmo princípio do moverQuem, mas com duas colunas
      // independentes em vez de uma imagem só. A folga é calculada a partir
      // da altura real de cada coluna (scrollHeight), não de um scale fixo,
      // porque cada coluna tem um número diferente de fotos.
      const CT_FACTOR_A = 0.10;
      const CT_FACTOR_B = 0.20;
      const ctGrid = document.querySelector('.comotrabalhamos__grid');
      const ctColA = ctGrid?.querySelector('.comotrabalhamos__col--a');
      const ctColB = ctGrid?.querySelector('.comotrabalhamos__col--b');
      const moverComoTrabalhamos = () => {
        if (!ctGrid || !ctColA || !ctColB) return;
        const r = ctGrid.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;   // fora de vista
        const dist = (r.top + r.height / 2) - window.innerHeight / 2;
        const folgaA = Math.max(0, (ctColA.scrollHeight - ctGrid.clientHeight) / 2);
        const folgaB = Math.max(0, (ctColB.scrollHeight - ctGrid.clientHeight) / 2);
        let offA = -dist * CT_FACTOR_A;
        let offB = -dist * CT_FACTOR_B;
        if (offA > folgaA) offA = folgaA; else if (offA < -folgaA) offA = -folgaA;
        if (offB > folgaB) offB = folgaB; else if (offB < -folgaB) offB = -folgaB;
        ctColA.style.setProperty('--ct-parallax-a', offA.toFixed(1) + 'px');
        ctColB.style.setProperty('--ct-parallax-b', offB.toFixed(1) + 'px');
      };
```

- [ ] **Step 2: Wire it into the Lenis scroll event and the boot calls**

Find this line (the `lenis.on('scroll', ...)` call):

```js
      lenis.on('scroll', ({ scroll }) => { moverHero(scroll); moverQuem(); });
```

Change it to:

```js
      lenis.on('scroll', ({ scroll }) => { moverHero(scroll); moverQuem(); moverComoTrabalhamos(); });
```

Find the boot calls right before `document.addEventListener('astro:page-load', iniciarLenis);`:

```js
      moverHero(window.scrollY);
      moverQuem();
    }
```

Change to:

```js
      moverHero(window.scrollY);
      moverQuem();
      moverComoTrabalhamos();
    }
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Visual verification in the browser**

Use the `run` skill to start the dev server (`npm run dev`) and open `/sobre-nos` in a browser tab. Scroll to the "Como trabalhamos" section and confirm:
- Two columns of images are visible, offset vertically (masonry look), showing real empreendimento photos (not broken image icons).
- Scrolling up/down moves the two columns at visibly different speeds (column B faster than column A).
- The paragraph on the other half reads as flowing prose with 3 numbers highlighted in orange, not a stat-tile grid.
- No layout overflow/horizontal scrollbar appears at both desktop and a narrow (≈375px) viewport width.

If any image fails to load, re-check the path against `public/images/empreendimentos/` (see Task 1 Step 3) and fix `sobre.json`.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: parallax de duas colunas para a grelha de Como Trabalhamos"
```

---

## Self-Review Notes

- **Spec coverage:** half-grid layout (Task 2/3), 5 real empreendimento images pulled regardless of `imagemReal` (Task 1), masonry 2-column (3+2) with different speeds (Task 3/4), paragraph merging vertical copy + 3 counter phrases inline, no tile grid/no count-up (Task 1/2/3) — all covered. Old `.verticais`/`.vertical` markup and CSS fully removed (Task 2 Step 2, Task 3 Step 1).
- **Placeholder scan:** none — every step has literal file paths, full code blocks, and exact before/after snippets.
- **Type/name consistency:** `sobre.oQueFazemos.imagens.colunaA/colunaB` (Task 1) matches the `.map()` calls in Task 2; `.comotrabalhamos__grid`/`__col--a`/`__col--b` names match exactly between Task 2 (markup), Task 3 (CSS), and Task 4 (`querySelector` calls); `--ct-parallax-a`/`--ct-parallax-b` custom property names match between Task 3's CSS `transform` and Task 4's `style.setProperty` calls.
