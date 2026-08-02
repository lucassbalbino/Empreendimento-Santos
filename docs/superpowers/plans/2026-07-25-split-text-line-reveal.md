# Split-text por linha (line-mask reveal) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar uma animação de split-text por linha (cada linha sobe de baixo de uma máscara, em cascata, com gatilho tardio) a todo o texto de secção do site.

**Architecture:** Um módulo cliente (`src/scripts/split-reveal.js`) usa `split-type` para partir cada elemento de texto de secção em linhas, envolve cada linha numa `.line__inner` (a peça que translada; a `.line` clipa via `overflow:hidden`) e revela em cascata através de um IntersectionObserver próprio com margem inferior negativa (gatilho tardio). Corre por `astro:page-load` (1.ª carga + soft-nav) e re-parte no `resize`. Os mesmos seletores de texto são retirados do block-reveal existente (JS **e** CSS) para não haver dupla animação.

**Tech Stack:** Astro 4, `split-type` (nova dep), CSS em `public/styles.css`, scripts de módulo em `Base.astro` (padrão do Lenis).

## Global Constraints

- Animar **só** `transform` (a máscara dispensa opacity). Regra da casa: só transform/opacity.
- Gated por `prefers-reduced-motion: reduce` **e** por `IntersectionObserver` — se qualquer falhar, não parte nada.
- **Progressive enhancement:** se o script não correr, o texto fica legível (o estado escondido só se aplica a elementos já marcados com `.split-ready` pelo JS).
- **O CSS live é `public/styles.css`** (os ficheiros na raiz são mockup legado; editar a raiz não muda nada).
- **ViewTransitions:** os elementos são novos a cada soft-nav; re-partir por `astro:page-load` (dispara na 1.ª carga e em cada navegação suave).
- **Excluídos do line-split:** hero (`.hero …`, tem entrada própria via cortina) e cards repetidos (`.card, .stat, .vertical, .service, .member, .panels`, mantêm block-reveal).
- **Timing (pesado):** duração `1.2s`, easing `cubic-bezier(.16,1,.3,1)`, stagger `calc(var(--i) * 150ms)`, gatilho tardio `rootMargin: '0px 0px -25% 0px'`.
- **Verificação em aba VISÍVEL** do browser (a aba oculta suspende IO/transições/rAF); validar por classe (`.line`, `.is-revealed`), não por estilo computado.
- **Sem framework de testes JS** no projeto, e o split depende de layout/fontes reais (jsdom não faz layout, não mede linhas). A verificação de comportamento é feita no browser real; a integridade de build é verificada com `npm run build`.

---

## Task 1: Adicionar a dependência `split-type`

**Files:**
- Modify: `package.json` (bloco `dependencies`)

**Interfaces:**
- Produces: import `SplitType from 'split-type'` disponível para o módulo da Task 4.

- [ ] **Step 1: Instalar a dependência**

Run:
```bash
npm install split-type@^0.3.4
```
Expected: `package.json` passa a listar `"split-type"` em `dependencies` e `package-lock.json` é atualizado; sem erros.

- [ ] **Step 2: Confirmar que ficou registada**

Run:
```bash
node -e "console.log(require('./package.json').dependencies['split-type'])"
```
Expected: imprime uma versão, ex.: `^0.3.4`.

- [ ] **Step 3: Confirmar que o build continua a passar**

Run:
```bash
npm run build
```
Expected: build conclui sem erros (ainda ninguém importa a lib; só confirma que a instalação não partiu nada).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: adicionar split-type para o split-text por linha"
```

---

## Task 2: Retirar o texto de secção do block-reveal (JS + CSS)

Move os seletores de texto de secção para fora do reveal de blocos, para o line-split poder ser o único a animá-los. **Tem de ser JS e CSS juntos:** o CSS esconde (`opacity:0`) até `.is-visible`; se o JS deixar de os observar mas o CSS continuar a escondê-los, o texto ficava invisível para sempre.

**Files:**
- Modify: `src/layouts/Base.astro:69` (constante `SEL` do reveal inline)
- Modify: `public/styles.css:870-886` (blocos `:is(...)` do reveal)

**Interfaces:**
- Produces: os seletores `.section .display, .section .lead, .split__body > p, .quemsomos__intro > p` deixam de ter qualquer animação de reveal — ficam disponíveis para o módulo da Task 4 (que usa exatamente estes seletores).

- [ ] **Step 1: Remover os seletores de texto da lista `SEL` do reveal (Base.astro)**

Em `src/layouts/Base.astro`, linha 69, substituir:
```js
      var SEL = '.section, .section .display, .section .lead, .split__body > p, .quemsomos__intro > p, .card, .stat, .vertical, .service, .member, .panels, .reveal-wipe-lr, .reveal-rise-slow';
```
por:
```js
      var SEL = '.section, .card, .stat, .vertical, .service, .member, .panels, .reveal-wipe-lr, .reveal-rise-slow';
```

- [ ] **Step 2: Remover os mesmos seletores dos dois blocos `:is(...)` do CSS**

Em `public/styles.css`, substituir o bloco (linhas ~870-886):
```css
html.reveal-ready :is(
  .section .display, .section .lead,
  .split__body > p, .quemsomos__intro > p, .card, .stat, .vertical, .service, .member, .panels
){
  opacity:0;
  transform:translateY(26px);
  transition:opacity .32s var(--ease),
             transform 1.1s var(--ease);
  will-change:transform, opacity;
}
html.reveal-ready :is(
  .section .display, .section .lead,
  .split__body > p, .quemsomos__intro > p, .card, .stat, .vertical, .service, .member, .panels
).is-visible{
  opacity:1;
  transform:none;
}
```
por:
```css
html.reveal-ready :is(
  .card, .stat, .vertical, .service, .member, .panels
){
  opacity:0;
  transform:translateY(26px);
  transition:opacity .32s var(--ease),
             transform 1.1s var(--ease);
  will-change:transform, opacity;
}
html.reveal-ready :is(
  .card, .stat, .vertical, .service, .member, .panels
).is-visible{
  opacity:1;
  transform:none;
}
```

- [ ] **Step 3: Verificar no browser que o texto de secção fica visível (sem animação, por agora)**

Run (num terminal à parte):
```bash
npm run dev
```
Abrir `http://localhost:4321/sobre-nos` numa **aba visível**. Rolar até às secções abaixo da hero.
Expected: títulos (`.display`/`h2`), `.lead` e parágrafos de prosa aparecem **normalmente** e legíveis (já não fazem fade-rise; ainda não fazem line-split). Cards (`.vertical`, `.stat`, etc.) continuam a fazer o fade-rise como antes.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro public/styles.css
git commit -m "refactor: tirar o texto de seccao do block-reveal (JS+CSS) para dar lugar ao line-split"
```

---

## Task 3: CSS da máscara de linha

Adiciona os estilos do line-mask. O estado escondido é gated por `.split-ready` (classe posta pelo JS por elemento), garantindo progressive enhancement: sem JS, não há `.line`/`.split-ready` e o texto fica normal.

**Files:**
- Modify: `public/styles.css` (acrescentar um bloco novo, a seguir ao `.reveal-mask` na zona de reveals, ~linha 892)

**Interfaces:**
- Consumes: marcação `.line > .line__inner[style="--i:N"]` e classes `.split-ready` / `.is-revealed` / `.split-instant` no elemento alvo — todas produzidas pelo módulo da Task 4.
- Produces: o comportamento visual da subida por linha.

- [ ] **Step 1: Acrescentar o bloco de CSS**

Em `public/styles.css`, a seguir à regra `.reveal-mask{ overflow:hidden; }` (~linha 892), adicionar:
```css
/* ===== Split-text por linha (line-mask reveal) ==============================
   O split-type parte o texto em .line; o JS envolve cada linha numa .line__inner.
   A .line clipa (overflow), a .line__inner sobe de translateY(110%) até 0. Só
   transform. Estado escondido gated por .split-ready (posta pelo JS por elemento)
   -> sem JS, nada disto se aplica e o texto fica legível. */
.line { overflow: hidden; }
.split-ready .line__inner {
  display: block;
  transform: translateY(110%);              /* escondida por baixo da máscara */
  transition: transform 1.2s cubic-bezier(.16,1,.3,1);
  transition-delay: calc(var(--i, 0) * 150ms);  /* stagger linha-a-linha */
  will-change: transform;
}
.split-ready.is-revealed .line__inner { transform: translateY(0); }
/* Resize: repor o estado revelado sem re-animar. */
.split-instant .line__inner { transition: none !important; }
```

- [ ] **Step 2: Verificar que o CSS é válido (build passa)**

Run:
```bash
npm run build
```
Expected: build sem erros (o CSS é copiado de `public/`; um erro de sintaxe grosseiro não parte o build, mas confirma que nada regrediu). Inspeção visual: o bloco existe no ficheiro.

- [ ] **Step 3: Commit**

```bash
git add public/styles.css
git commit -m "feat: CSS do line-mask reveal (linha sobe atras de mascara, pesado)"
```

---

## Task 4: Módulo de split + reveal (core)

Cria o módulo que parte o texto em linhas e revela em cascata com gatilho tardio. Importado por um script de módulo em `Base.astro` (padrão do Lenis).

**Files:**
- Create: `src/scripts/split-reveal.js`
- Modify: `src/layouts/Base.astro` (adicionar `<script>import '../scripts/split-reveal.js';</script>` junto ao script do Lenis)

**Interfaces:**
- Consumes: `SplitType` de `split-type` (Task 1); classes CSS da Task 3; seletores libertados na Task 2.
- Produces: por elemento alvo, marcação `.line > .line__inner` com `--i`, e as classes `.split-ready` e (ao entrar em vista) `.is-revealed`.

- [ ] **Step 1: Criar `src/scripts/split-reveal.js`**

```js
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
  // a hero (.hero, não .section) e os cards (não têm .display/.lead nem
  // .split__body>p / .quemsomos__intro>p).
  const SEL = '.section .display, .section .lead, .split__body > p, .quemsomos__intro > p';
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
```

Nota: a Task 5 acrescenta os listeners de `resize`/`scroll` **dentro** de `init()`, antes deste `astro:page-load`, usando `SEL`/`instances`/`io`/`splitOne`/`reveal` que já estão em escopo.

- [ ] **Step 2: Importar o módulo em `Base.astro`**

Em `src/layouts/Base.astro`, logo a seguir ao bloco `<script> … import Lenis … </script>` (fecha na linha ~238), adicionar:
```astro
  <!-- Split-text por linha: parte o texto de secção e revela linha-a-linha. -->
  <script>
    import '../scripts/split-reveal.js';
  </script>
```

- [ ] **Step 3: Verificar o line-split no browser**

Com `npm run dev` a correr, abrir `http://localhost:4321/sobre-nos` numa **aba visível**. Rolar devagar até uma secção de texto (ex.: "Quem Somos") entrar bem no ecrã.
Expected:
- O título e os parágrafos revelam-se **linha a linha, de baixo para cima**, em cascata (~1.2s, stagger visível).
- O reveal dispara **tarde** (só quando o bloco já subiu bastante, não à beira de baixo).
- A **hero não é afetada** (mantém a entrada própria).
- Cards (`.vertical`, `.stat`) continuam com o fade-rise de bloco.

Verificação por classe (na consola do browser, aba visível):
```js
document.querySelectorAll('.section .display .line').length   // > 0 (texto partido)
document.querySelector('.section .display').classList.contains('is-revealed') // true depois de rolar até ele
```

- [ ] **Step 4: Verificar o build**

Run:
```bash
npm run build
```
Expected: build sem erros; o `split-type` é bundlado no output do script.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/split-reveal.js src/layouts/Base.astro
git commit -m "feat: modulo de split-text por linha com reveal tardio em cascata"
```

---

## Task 5: Re-split no resize + fail-safe por scroll

A quebra de linha muda com a largura → re-partir no resize (preservando o que já estava revelado, sem re-animar). E, como o resto do site, não depender só do IO: fail-safe por scroll revela o que já passou o limiar quando o IO está suspenso (aba em 2.º plano, bfcache).

**Files:**
- Modify: `src/scripts/split-reveal.js` (dentro de `init()`, usando o `instances`/`io`/`splitOne` já existentes)

**Interfaces:**
- Consumes: `SEL`, `instances`, `io`, `splitOne`, `reveal` definidos na Task 4.
- Produces: comportamento estável em resize e sob IO suspenso.

- [ ] **Step 1: Acrescentar resize + fail-safe dentro de `init()`**

Em `src/scripts/split-reveal.js`, **imediatamente antes** do `document.addEventListener('astro:page-load', …)`, inserir:
```js
  // Re-parte no resize (a quebra de linha muda com a largura). Preserva o que já
  // estava revelado e repõe-no sem re-animar (.split-instant desliga a transição).
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const revealed = new Set(
        instances.filter((x) => x.el.classList.contains('is-revealed')).map((x) => x.el)
      );
      // teardown local (não podemos chamar o teardown de page-load: queremos
      // reobservar seletivamente).
      instances.forEach(({ el, split }) => {
        io.unobserve(el);
        try { split.revert(); } catch (_) {}
        el.classList.remove('split-ready', 'is-revealed');
      });
      instances.length = 0;
      document.querySelectorAll(SEL).forEach((el) => {
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
    }, 150);
  }, { passive: true });

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
```

Nota: os listeners são ligados uma só vez (o módulo avalia uma vez), e usam sempre o `instances` atual (module-scope), tal como o loop do Lenis lê sempre a instância atual.

- [ ] **Step 2: Verificar o resize no browser**

Com `npm run dev`, em `http://localhost:4321/sobre-nos` (aba visível): rolar até revelar uma secção de texto, depois **redimensionar a janela** na horizontal (mudar a largura o suficiente para as linhas re-quebrarem).
Expected:
- O texto re-parte para o novo número de linhas e **continua visível** (não volta a esconder-se nem re-anima do zero).
- Blocos ainda não revelados (mais abaixo) continuam escondidos e revelam ao rolar.

- [ ] **Step 3: Verificar o fail-safe por scroll (IO suspenso)**

Na consola do browser (aba visível), simular ausência de reveal por IO forçando o caminho de scroll: rolar rápido de forma a que um bloco entre e verificar que revela mesmo assim.
```js
// depois de rolar até um bloco abaixo do fold:
document.querySelector('.split__body > p')?.classList.contains('is-revealed') // true
```
Expected: `true` — o bloco revela por scroll mesmo que o IO não tivesse disparado.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/split-reveal.js
git commit -m "feat: re-split no resize (sem re-animar) e fail-safe por scroll"
```

---

## Task 6: Verificação integrada em todo o site

Passagem final: confirmar o efeito em várias páginas, na navegação por cortina, e com reduced-motion.

**Files:** (nenhum — só verificação)

- [ ] **Step 1: Reduced-motion desliga tudo**

Nas DevTools do Chrome: Rendering → "Emulate CSS prefers-reduced-motion: reduce". Recarregar `http://localhost:4321/sobre-nos`.
Expected: o texto aparece **normal e imediato**, sem line-split e sem esconder. Na consola: `document.querySelectorAll('.line').length === 0`.

- [ ] **Step 2: Multi-página**

Com reduced-motion **desligado**, visitar `http://localhost:4321/` (home), `/sobre-nos`, `/portfolio`, `/historico`, `/equipa`, `/contactos`. Em cada uma, rolar pelas secções.
Expected: o texto de secção revela linha-a-linha em todas; hero intacta; cards com fade-rise de bloco; sem texto escondido preso.

- [ ] **Step 3: Navegação por cortina (soft-nav)**

Clicar num item da navbar para navegar (dispara a cortina). Depois de a página nova assentar, rolar pelas secções.
Expected: a hero da página nova entra pela cortina (entrada própria); as secções seguintes fazem line-split normalmente (re-partido por `astro:page-load`). Sem duplicação nem texto preso.

- [ ] **Step 4: Sem flash na 1.ª pintura**

Recarregar uma página com texto de secção acima do fold (se existir) e observar.
Expected: sem "flash" de texto visível→escondido→revelado percetível. (Nota: o texto de secção fica tipicamente abaixo do fold, por baixo da hero, pelo que o flash não deve ocorrer; o gate `.split-ready` + `document.fonts.ready` minimizam-no.)

- [ ] **Step 5: Build final**

Run:
```bash
npm run build
```
Expected: build sem erros.

- [ ] **Step 6: Commit (se houver ajustes) e fim**

Se algum passo obrigou a afinar valores (ex.: `-25%`, `1.2s`, `150ms`), commitar:
```bash
git add -A
git commit -m "polish: afinar timing/gatilho do split-text apos verificacao no browser"
```
Caso contrário, nada a commitar — a feature está completa.

---

## Notas de afinação (pós-verificação)

Botões para mexer, todos no CSS da Task 3 (exceto o gatilho, no JS da Task 4):
- **Mais tarde a entrar:** `rootMargin` mais negativo (ex.: `-35%`), em `split-reveal.js`.
- **Mais pesado/lento:** subir a duração (`1.4s`) e/ou o stagger (`180ms`).
- **Curso:** já em `translateY(110%)` (totalmente escondido); aumentá-lo só acelera, não adiciona distância visível — o peso vem de duração + easing.
