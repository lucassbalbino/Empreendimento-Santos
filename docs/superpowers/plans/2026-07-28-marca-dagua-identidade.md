# Marca-d'água do símbolo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar o símbolo da marca (três blocos + encaixe) para todas as páginas como marca-d'água variada (contorno/preenchido/escuro), dando identidade sem quebrar os sistemas existentes.

**Architecture:** Um componente `Watermark.astro` rende uma camada absoluta auto-clipada com o SVG do símbolo. A camada ancora sempre no **wrapper de conteúdo** (`.container` para secções, `.hero__inner` para heros) — nunca na `<section>` — para não interferir com a costura diagonal (`.stitch`), que depende de as secções ficarem não-posicionadas. Variação (afinação / lado / escala / cor) por classes modificadoras.

**Tech Stack:** Astro (componentes `.astro`), CSS vivo em `public/styles.css`. Sem framework de testes — verificação é `npm run build` (compila) + inspeção visual em `npm run dev`.

## Global Constraints

- **CSS vivo é `public/styles.css`** (os ficheiros na raiz do repo são mockup legado — não tocar).
- **Ancorar no wrapper de conteúdo, nunca na `<section>`.** `.has-wm` vai no `.container` (ou o watermark vai dentro do `.hero__inner`, que já é stacking context). Pôr `position` na `<section>` quebra o overlap da costura.
- **Afinações (valores verbatim):** contorno `opacity:.5`, `stroke:var(--accent)`, `stroke-width:2.4`; preenchido `opacity:.07`, `fill:var(--accent)`; escuro `opacity:.08`, `fill:#f2efe9`.
- **Escalas:** `sm = min(24%,210px)`, `md = min(34%,320px)`, `lg = min(46%,440px)`. **Lados:** `l = left:-6%`, `r = right:-6%`.
- **A marca-d'água é decorativa e estática:** `aria-hidden="true"`; **nunca** leva classes `reveal-*` (não entra na cascata de reveal).
- **`overflow:clip`, não `hidden`** (evita criar scroll container).
- **Uma marca por secção;** nunca duas afinações iguais em secções adjacentes.
- **Sessão paralela:** `public/styles.css` e `src/components/Header.astro` têm WIP não-commitado de outra sessão do utilizador. Antes de executar, resolver esse WIP (commitá-lo ou pô-lo em stash) para não o arrastar. **Proibido git destrutivo** (`reset --hard`, `checkout --`, `push --force`). Commitar **sempre com caminhos explícitos** (`git add <ficheiros>`), nunca `git add -A`.
- **Deferido nesta vaga:** a marca-d'água *interior* da secção escura do Portfólio no `index` (o `<DoubleSlider>` não tem `.container` simples e tem camadas próprias). A marca escura chega a essa página pelo Hero. Fica para 2ª vaga, passando um prop ao `DoubleSlider`.

---

## Estrutura de ficheiros

- **Criar:** `src/components/Watermark.astro` — o componente (SVG + classes de variação).
- **Modificar:** `public/styles.css` — bloco CSS `.has-wm` / `.wm-layer` / `.wm--*` (anexar no fim).
- **Modificar:** `src/components/Hero.astro` — watermark escura no `.hero__inner` (usado pelo `index`).
- **Modificar (páginas):** `src/pages/index.astro`, `sobre-nos.astro`, `equipa.astro`, `contactos.astro`, `portfolio.astro`, `historico.astro`, `empreendimentos/[slug].astro` — inserir `<Watermark>` nos wrappers de conteúdo + `import`.

**Padrão de inserção (vale para todas as secções normais):**
1. Adicionar `has-wm` à classe do `<div class="container ...">` da secção.
2. Inserir `<Watermark variant="…" side="…" size="…" />` como **primeiro filho** desse `.container`.
3. Garantir o `import Watermark from '…/components/Watermark.astro';` no frontmatter da página.

**Padrão para heros:** inserir `<Watermark variant="dark" side="r" size="lg" />` como **primeiro filho** do `<div class="hero__inner">` (não precisa de `has-wm` — o `.hero__inner` já é `position:relative;z-index:2`).

---

### Task 1: Componente `Watermark` + CSS + primeira instância (smoke test)

**Files:**
- Create: `src/components/Watermark.astro`
- Modify: `public/styles.css` (anexar no fim)
- Modify: `src/pages/index.astro` (import + secção "QUEM SOMOS")

**Interfaces:**
- Produces: componente `Watermark` com props `variant: 'line'|'fill'|'dark'` (default `'line'`), `side: 'l'|'r'` (default `'r'`), `size: 'sm'|'md'|'lg'` (default `'md'`). Rende `<div class="wm-layer" aria-hidden><svg class="wm wm--{variant} wm--{side} wm--{size}">…</svg></div>`.
- Produces: classe CSS `.has-wm` (a pôr no wrapper de conteúdo) e `.wm-layer`/`.wm--*`.

- [ ] **Step 1: Criar o componente**

`src/components/Watermark.astro`:

```astro
---
interface Props {
  variant?: 'line' | 'fill' | 'dark';
  side?: 'l' | 'r';
  size?: 'sm' | 'md' | 'lg';
}
const { variant = 'line', side = 'r', size = 'md' } = Astro.props;
---
<div class="wm-layer" aria-hidden="true">
  <svg class={`wm wm--${variant} wm--${side} wm--${size}`} viewBox="0 0 100 92" preserveAspectRatio="xMidYMid meet">
    <rect class="bar" x="20" y="14" width="62" height="18"></rect>
    <rect class="bar" x="20" y="37" width="62" height="18"></rect>
    <rect class="bar" x="20" y="60" width="62" height="18"></rect>
    <rect class="tab" x="4" y="30" width="20" height="16"></rect>
  </svg>
</div>
```

- [ ] **Step 2: Anexar o CSS** ao fim de `public/styles.css`:

```css
/* ===== Marca-d'água do símbolo — identidade (spec 2026-07-28) ===== */
.has-wm{ position:relative; z-index:0; }
.wm-layer{ position:absolute; inset:0; overflow:clip; pointer-events:none; z-index:-1; }
.wm{ position:absolute; top:50%; transform:translateY(-50%); }
.wm--l{ left:-6%; }
.wm--r{ right:-6%; }
.wm--sm{ width:min(24%,210px); }
.wm--md{ width:min(34%,320px); }
.wm--lg{ width:min(46%,440px); }
.wm--line{ opacity:.5; }
.wm--line .bar, .wm--line .tab{ fill:none; stroke:var(--accent); stroke-width:2.4; vector-effect:non-scaling-stroke; }
.wm--fill{ opacity:.07; }
.wm--fill .bar, .wm--fill .tab{ fill:var(--accent); }
.wm--dark{ opacity:.08; }
.wm--dark .bar, .wm--dark .tab{ fill:#f2efe9; }
```

- [ ] **Step 3: Primeira instância** em `src/pages/index.astro`.

No frontmatter (após os outros imports, ~linha 11), adicionar:

```astro
import Watermark from '../components/Watermark.astro';
```

Na secção "QUEM SOMOS", alterar a abertura e inserir o componente:

```astro
  <section class="section section--tight-bottom quemsomos">
    <div class="container has-wm">
      <Watermark variant="line" side="l" size="md" />
      <div class="quemsomos__intro">
```

(era `<div class="container">` sem `has-wm` e sem `<Watermark>`.)

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 5: Verificação visual**

Run: `npm run dev` e abrir `http://localhost:4321/`.
Confirmar: na secção "Quem Somos" vê-se o símbolo em contorno laranja ténue, à esquerda, atrás do texto (texto legível por cima). A costura diagonal a seguir continua a funcionar. Sem saltos de reveal.

- [ ] **Step 6: Commit**

```bash
git add src/components/Watermark.astro public/styles.css src/pages/index.astro
git commit -m "feat: componente Watermark + marca-d'agua na seccao Quem Somos (index)"
```

---

### Task 2: `index.astro` — Hero + restantes secções

**Files:**
- Modify: `src/components/Hero.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: componente `Watermark` (Task 1).

- [ ] **Step 1: Hero com marca-d'água escura.** Em `src/components/Hero.astro`:

Frontmatter:

```astro
---
import Watermark from './Watermark.astro';
const { title, minHeight, image } = Astro.props;
---
```

Dentro do `.hero__inner`, inserir o componente como primeiro filho:

```astro
  <div class="hero__inner">
    <Watermark variant="dark" side="r" size="lg" />
    <div class="container">
      <h1 class="display">{title}</h1>
    </div>
  </div>
```

- [ ] **Step 2: Restantes secções do `index`.** Aplicar o padrão de inserção (`has-wm` no `.container` + `<Watermark>` como primeiro filho):

- **O QUE FAZEMOS** — `<div class="container dofazemos">` → `<div class="container has-wm dofazemos">`, inserir `<Watermark variant="fill" side="r" size="md" />`.
- **TRACK RECORD** (`.section--panels-cut`) — o `<div class="container">` do `<BlockHead>` → `has-wm`, inserir `<Watermark variant="fill" side="r" size="md" />`. (Os painéis ficam fora do container — não afetados.)
- **EQUIPA** (`.section--alt`) — `<div class="container">` → `has-wm`, inserir `<Watermark variant="line" side="l" size="md" />`.
- **CONTACTO** (`#contacto`) — `<div class="container">` → `has-wm`, inserir `<Watermark variant="line" side="r" size="sm" />`.

**Não** adicionar à secção PORTFÓLIO (`.section--dark`, `<DoubleSlider>`) — deferida (ver Global Constraints).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: sem erros.

- [ ] **Step 4: Verificação visual**

`npm run dev` → `http://localhost:4321/`. Percorrer a página inteira:
- Hero: símbolo off-white grande, à direita, atrás do título, sobre o overlay escuro.
- Secções brancas/painel alternam contorno/preenchido, esquerda/direita — nunca duas iguais seguidas.
- Todas as costuras diagonais continuam a desenhar-se por cima das secções.
- Os reveals (incl. slide dos cards e cortina) não saltam.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro src/pages/index.astro
git commit -m "feat: marca-d'agua no hero e restantes seccoes do index"
```

---

### Task 3: `sobre-nos.astro`

**Files:**
- Modify: `src/pages/sobre-nos.astro`

- [ ] **Step 1: Import.** No frontmatter, adicionar `import Watermark from '../components/Watermark.astro';`.

- [ ] **Step 2: Hero (inline).** No `.hero__inner`, inserir como primeiro filho: `<Watermark variant="dark" side="r" size="lg" />`.

- [ ] **Step 3: Secções.** Padrão `has-wm` no `.container` + `<Watermark>` primeiro filho:

- **QUEM SOMOS** (`<section class="section">`) — `<Watermark variant="line" side="l" size="md" />`.
- **O QUE FAZEMOS — VERTICAIS** (`.section--alt`) — `<Watermark variant="fill" side="r" size="md" />`.
- **SERVIÇOS** (`<section class="section">`) — `<Watermark variant="line" side="l" size="md" />`.
- **EQUIPA** (`.section--alt`) — `<Watermark variant="fill" side="r" size="md" />`.
- **CONTACTO** (`#contacto`) — `<Watermark variant="line" side="l" size="sm" />`.

- [ ] **Step 4: Build**

Run: `npm run build` — sem erros.

- [ ] **Step 5: Verificação visual**

`http://localhost:4321/sobre-nos` — hero escuro + 5 secções alternadas; costuras intactas.

- [ ] **Step 6: Commit**

```bash
git add src/pages/sobre-nos.astro
git commit -m "feat: marca-d'agua na pagina sobre-nos"
```

---

### Task 4: `equipa.astro` + `contactos.astro`

**Files:**
- Modify: `src/pages/equipa.astro`
- Modify: `src/pages/contactos.astro`

- [ ] **Step 1: `equipa.astro`.** Import `import Watermark from '../components/Watermark.astro';`. Depois:
- **Hero (inline)** — `.hero__inner` → `<Watermark variant="dark" side="r" size="lg" />`.
- **DIREÇÃO** (`<section class="section">`) — `has-wm` + `<Watermark variant="line" side="l" size="md" />`.
- **EQUIPA GERAL** (`.section--alt`) — `has-wm` + `<Watermark variant="fill" side="r" size="md" />`.
- **CONTACTO** (`#contacto`) — `has-wm` + `<Watermark variant="line" side="l" size="sm" />`.

- [ ] **Step 2: `contactos.astro`.** Import `import Watermark from '../components/Watermark.astro';`. Depois:
- **Hero (inline)** — `.hero__inner` → `<Watermark variant="dark" side="r" size="lg" />`.
- **CONTACTO** (`#contacto`) — `has-wm` + `<Watermark variant="line" side="l" size="md" />`.
- **ONDE ESTAMOS** (`.section--alt`) — `has-wm` + `<Watermark variant="fill" side="r" size="md" />`.

- [ ] **Step 3: Build**

Run: `npm run build` — sem erros.

- [ ] **Step 4: Verificação visual**

`http://localhost:4321/equipa` e `/contactos` — heros escuros + secções alternadas; costuras intactas.

- [ ] **Step 5: Commit**

```bash
git add src/pages/equipa.astro src/pages/contactos.astro
git commit -m "feat: marca-d'agua nas paginas equipa e contactos"
```

---

### Task 5: `portfolio.astro` + `historico.astro`

**Files:**
- Modify: `src/pages/portfolio.astro`
- Modify: `src/pages/historico.astro`

Ambas as páginas **não têm hero** (abrem direto nos cards).

- [ ] **Step 1: `portfolio.astro`.** Import `import Watermark from '../components/Watermark.astro';`. Depois:

- **Blocos mapeados** — dentro do `.map((s, i) =>`, no `<div class="container">`, adicionar `has-wm` e inserir o componente variando por índice:

```astro
      <section class={`section section--centered-head ${i === 1 ? "section--alt" : "section--flat-top"}`}>
        <div class="container has-wm">
          <Watermark variant={i === 0 ? "line" : "fill"} side={i === 0 ? "r" : "l"} size="md" />
          <BlockHead …/>
```

  (i=0 → contorno direita; i=1 → preenchido esquerda.)
- **CONTACTO** (`#contacto`) — `has-wm` + `<Watermark variant="line" side="r" size="sm" />`.

- [ ] **Step 2: `historico.astro`.** Import `import Watermark from '../components/Watermark.astro';`. Depois:

- **CONCLUÍDOS** (`.section--flat-top`) — `has-wm` no `.container` + `<Watermark variant="line" side="r" size="md" />`. (A regra de reveal `.section--flat-top .block-head :is(...)` só afeta filhos do `.block-head`, não o `.wm-layer` — confirmar na verificação visual que a marca aparece.)
- **CONTACTO** (`.section--alt #contacto`) — `has-wm` + `<Watermark variant="fill" side="l" size="sm" />`.

- [ ] **Step 3: Build**

Run: `npm run build` — sem erros.

- [ ] **Step 4: Verificação visual**

`http://localhost:4321/portfolio` e `/historico` — marca-d'água visível nos cabeçalhos dos blocos; o slide pesado dos cards e a modal do histórico continuam a funcionar; costuras intactas.

- [ ] **Step 5: Commit**

```bash
git add src/pages/portfolio.astro src/pages/historico.astro
git commit -m "feat: marca-d'agua nas paginas portfolio e historico"
```

---

### Task 6: `empreendimentos/[slug].astro`

**Files:**
- Modify: `src/pages/empreendimentos/[slug].astro`

- [ ] **Step 1: Import.** No frontmatter: `import Watermark from '../../components/Watermark.astro';` (nota: `../../`).

- [ ] **Step 2: Hero.** No `.hero__inner` do `<section class="hero emp-hero">`, inserir como primeiro filho: `<Watermark variant="dark" side="r" size="lg" />`.

- [ ] **Step 3: Secções.** Padrão `has-wm` + `<Watermark>` primeiro filho:
- **O EMPREENDIMENTO** (`<section class="section">`) — `<Watermark variant="line" side="l" size="md" />`.
- **CARACTERÍSTICAS** (`.section--alt`) — `<Watermark variant="fill" side="r" size="md" />`.
- **GALERIA** (condicional, `<section class="section">`) — `<Watermark variant="line" side="l" size="md" />`.
- **LOCALIZAÇÃO** (`.section--alt`) — `<Watermark variant="fill" side="r" size="md" />`.
- **OUTROS EMPREENDIMENTOS** (condicional, `<section class="section">`) — `<Watermark variant="line" side="l" size="md" />`.
- **CONTACTO** (`#contacto`) — `<Watermark variant="fill" side="r" size="sm" />`.

- [ ] **Step 4: Build**

Run: `npm run build` — sem erros.

- [ ] **Step 5: Verificação visual**

`http://localhost:4321/empreendimentos/<slug>` (usar um slug real, ex. o primeiro de `data/empreendimentos.json`). Hero escuro + secções alternadas; costuras intactas.

- [ ] **Step 6: Commit**

```bash
git add "src/pages/empreendimentos/[slug].astro"
git commit -m "feat: marca-d'agua na pagina de detalhe do empreendimento"
```

---

## Self-review (cobertura vs. spec)

- **Símbolo SVG / geometria** → Task 1 (componente). ✓
- **Duas afinações (contorno/preenchido) + escuro** → CSS Task 1; usadas em todas as tasks. ✓
- **Sistema de variação (afinação/lado/escala/cor, sem repetir adjacente)** → params por secção em todas as tasks. ✓
- **Intensidade validada (.5 / .07 / .08)** → CSS Task 1 verbatim. ✓
- **Mapa de colocação (todas as páginas)** → Tasks 2–6; heros em todas as páginas com hero. ✓
- **Coexistência com costura** → ancoragem no wrapper de conteúdo (constraint + padrão). ✓
- **Não entrar no reveal** → constraint + `aria-hidden`, sem classes `reveal-*`. ✓
- **`overflow:clip`** → CSS Task 1. ✓
- **Deferido:** watermark interior do slider Portfólio (documentado). ✓
