# Entrada dos cards do portfólio (cortina branca + subida Lenis) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer os cards do portfólio subir de trás do fundo branco (efeito cortina) ao entrar no ecrã, com easing forte estilo Lenis.

**Architecture:** Cada `<ProjectCard>` do portfólio é envolvido numa moldura `.card-rise` com `overflow:hidden`. O card começa em `translateY(100%)` (escondido atrás do branco estático da secção) e sobe até `translateY(0)` quando o `IntersectionObserver` existente lhe põe `.is-visible`. Um mini-script reabre a moldura (`overflow:visible`) no fim, para o hover não ser cortado. Só o card se move; o fundo branco é estático.

**Tech Stack:** Astro, CSS (transições no compositor: `transform`), JS inline (vanilla, `astro:page-load` + `transitionend`).

## Global Constraints

- Só a página `src/pages/portfolio.astro` muda de comportamento; nenhuma outra página altera o seu reveal.
- Só `transform` anima (nada de `clip-path` — decisão de performance já registada no CSS).
- Tudo gated por `html.reveal-ready` → respeita `prefers-reduced-motion: reduce`.
- `Base.astro` não é alterado.
- CSS live é `public/styles.css` (os ficheiros na raiz são mockup legado e não afetam o site).
- Easing da subida: `cubic-bezier(.16,1,.3,1)`, duração `1.2s`.
- Cascata por coluna (grelha de 3): 0 / 0.09s / 0.18s.
- Verificação é no browser (Chrome via dev server). Servidor: `npm run dev` (Astro, normalmente em `http://localhost:4321`).

---

### Task 1: Máscara + subida dos cards

Envolver os cards numa moldura e escrever o CSS da subida. No fim desta task, a primeira linha sobe ao abrir e as seguintes ao rolar. (O hover fica temporariamente cortado — resolvido na Task 2.)

**Files:**
- Modify: `src/pages/portfolio.astro` (o `.map` das `secoes`, linhas ~25-27)
- Modify: `public/styles.css` (novo bloco a seguir ao reveal dos cards, perto da linha ~918)

**Interfaces:**
- Consumes: `IntersectionObserver` do `Base.astro`, que adiciona `.is-visible` ao `.card` ao entrar no viewport (já existe, não muda).
- Produces: classe de moldura `.card-rise` (filho direto de `.grid-projects`, contém um `.card`). A Task 2 liga o `transitionend` do `transform` deste `.card` para adicionar `.is-open` à `.card-rise`.

- [ ] **Step 1: Envolver cada ProjectCard numa moldura `.card-rise`**

Em `src/pages/portfolio.astro`, trocar:

```astro
          <div class="grid-projects">
            {s.projetos.map((p) => (<ProjectCard proj={p} />))}
          </div>
```

por:

```astro
          <div class="grid-projects">
            {s.projetos.map((p) => (
              <div class="card-rise"><ProjectCard proj={p} /></div>
            ))}
          </div>
```

- [ ] **Step 2: Adicionar o bloco CSS da subida**

Em `public/styles.css`, imediatamente a seguir à regra `html.reveal-ready .reveal-rise-slow.is-visible{ … }` (~linha 918), adicionar:

```css
/* Entrada dos cards do portfólio: sobem de trás do fundo branco (cortina).
   O branco é o fundo estático da secção, visível através da moldura; só o
   card se move. Disparado pelo mesmo IntersectionObserver do reveal geral
   (a 1.ª linha sobe ao carregar, as seguintes ao entrar no ecrã).
   Especificidade acima da regra genérica de .card, para usar a subida
   grande (translateY(100%)) e ficar opaco, em vez do reveal de 26px. */
html.reveal-ready .card-rise{ overflow:hidden; }
html.reveal-ready .card-rise .card{
  display:block;
  opacity:1;
  transform:translateY(100%);
  transition:transform 1.2s cubic-bezier(.16,1,.3,1);
  will-change:transform;
}
html.reveal-ready .card-rise .card.is-visible{ transform:translateY(0); }
/* cascata por coluna (grelha de 3): esquerda → direita */
html.reveal-ready .card-rise:nth-child(3n+2) .card{ transition-delay:.09s; }
html.reveal-ready .card-rise:nth-child(3n+3) .card{ transition-delay:.18s; }
```

- [ ] **Step 3: Arrancar o dev server e verificar a subida**

Run: `npm run dev` (deixar a correr; abrir `http://localhost:4321/portfolio`).

Verificar no browser:
- Ao carregar a página, os cards da 1.ª linha **sobem de baixo para cima** e emergem de trás do branco, em cascata esquerda→direita.
- Ao rolar, cada linha seguinte faz a mesma subida quando entra no ecrã.
- Confirmar por **classe** (`.card` ganha `.is-visible`), não por estilo computado suspenso — ver memória `browser-verify-hidden-tab`. Usar uma aba visível (em foreground) para não ter o IntersectionObserver suspenso.

Esperado: subida visível e escalonada. (O hover ainda corta a sombra — é esperado nesta fase.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/portfolio.astro public/styles.css
git commit -m "feat: cards do portfólio sobem de trás do branco (cortina, easeOut forte)"
```

---

### Task 2: Reabrir a moldura no fim + reduced-motion

Resolver o corte do hover: depois de a subida terminar, a moldura passa a `overflow:visible`. Garantir também o caminho reduced-motion.

**Files:**
- Modify: `public/styles.css` (uma linha nova no mesmo bloco da Task 1)
- Modify: `src/pages/portfolio.astro` (adicionar `<script>` inline no fim do ficheiro, dentro do `<Base>`)

**Interfaces:**
- Consumes: `.card-rise` e o seu `.card` interno (Task 1); a transição de `transform` desse `.card`.
- Produces: classe `.is-open` na `.card-rise` quando a subida termina (ou de imediato, se não houver `reveal-ready`).

- [ ] **Step 1: Adicionar a regra de reabertura da moldura**

Em `public/styles.css`, no fim do bloco `.card-rise` criado na Task 1, adicionar:

```css
/* Depois da subida assentar, reabrir a moldura para o hover (elevação +
   sombra) não ser cortado pelo overflow:hidden. */
html.reveal-ready .card-rise.is-open{ overflow:visible; }
```

- [ ] **Step 2: Adicionar o script que liga `.is-open`**

Em `src/pages/portfolio.astro`, antes de fechar `</Base>` (a seguir à secção de contacto), adicionar:

```astro
  <script is:inline>
    (function () {
      var root = document.documentElement;
      function setup() {
        document.querySelectorAll('.card-rise').forEach(function (w) {
          if (w.dataset.riseBound) return;
          w.dataset.riseBound = '1';
          var card = w.querySelector('.card');
          if (!card) return;
          // Sem reveal-ready (reduced-motion / sem IO): a moldura abre já.
          if (!root.classList.contains('reveal-ready')) { w.classList.add('is-open'); return; }
          card.addEventListener('transitionend', function (e) {
            if (e.propertyName === 'transform') w.classList.add('is-open');
          });
        });
      }
      document.addEventListener('astro:page-load', setup);
    })();
  </script>
```

- [ ] **Step 3: Verificar o hover e o reduced-motion no browser**

Com o dev server a correr, em `http://localhost:4321/portfolio`:
- Depois de a subida assentar, passar o rato sobre um card: a **elevação e a sombra aparecem inteiras** (sem corte no topo/fundo).
- Confirmar por classe que a `.card-rise` ganhou `.is-open` após a subida.
- Simular reduced-motion (DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", ou o toggle do SO) e recarregar: os cards aparecem **já assentes**, sem movimento, e o hover funciona (a `.card-rise` fica `.is-open` de imediato).

Esperado: hover sem corte; reduced-motion sem animação.

- [ ] **Step 4: Confirmar que nenhuma outra página mudou**

Abrir `http://localhost:4321/` (home) e verificar que os cards continuam com o reveal genérico de 26px + fade (inalterado). `.card-rise` só existe no portfólio.

Esperado: home inalterada.

- [ ] **Step 5: Commit**

```bash
git add public/styles.css src/pages/portfolio.astro
git commit -m "feat: reabrir moldura do card no fim da subida (hover intacto) + reduced-motion"
```

---

## Self-Review

**Spec coverage:**
- Máscara + `translateY(100%)→0` → Task 1, Steps 1-2. ✅
- Gatilho pelo IO existente (1.ª linha ao abrir, resto ao rolar) → Task 1, Step 3 (verificação). ✅
- Easing Lenis `cubic-bezier(.16,1,.3,1)` 1.2s → Task 1, Step 2. ✅
- Cascata por coluna → Task 1, Step 2. ✅
- Card opaco (sem fade) / fundo branco estático → Task 1, Step 2 (`opacity:1`, sem overlay animado). ✅
- Hover não cortado (reabrir moldura) → Task 2, Steps 1-2. ✅
- Reduced-motion → Task 2, Step 2 (ramo sem `reveal-ready`) + Step 3 (verificação). ✅
- `Base.astro` intacto / resto do site inalterado → Task 2, Step 4. ✅

**Placeholder scan:** sem TBD/TODO; todo o código está presente. ✅

**Type/nome consistency:** `.card-rise`, `.card`, `.is-visible`, `.is-open`, `data-riseBound`, `transitionend`/`transform` usados de forma consistente entre Task 1 e Task 2. ✅
