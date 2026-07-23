# Transição de abertura — réplica da kononenkogroup

**Data:** 2026-07-23
**Branch:** `feat/transicao-cortina`
**Referência:** https://kononenkogroup.com/work/

## Objetivo

Replicar fielmente a experiência de abertura da referência no site AM Santos, com
**duas** animações distintas:

- **A — Preloader** (só na 1.ª carga real do site): ecrã branco com contador de
  percentagem e barra de progresso no topo.
- **B — Cortina entre páginas**: ao navegar, uma cortina com a **hero image da
  página de destino** cobre o ecrã e revela por `clip-path` wipe.

## Valores reais extraídos da referência

Da bundle Nuxt (`/_nuxt/Boo9Xm2v.js`):

- Cortina anima por `clip-path`, não por posição. Reveal real:
  `clip-path: inset(0% 0% 0% 0%)` → `inset(0% 0% 100% 0%)` — a faixa recolhe para
  cima (revela de baixo para cima).
- Easing custom `wipeFront`: `Ca.create("wipeFront","0.8,0,0.2,1")` →
  equivale a `cubic-bezier(0.8, 0, 0.2, 1)` (ease-in-out forte).
- Durante a transição: `lenis.stop()` → `lenis.start()`, e `scrollTop` ao topo na
  página nova.
- A referência mostra imagem durante a troca via uma camada **WebGL**
  (`webgl.beginPageTransition`). **Fora de âmbito.** Obtemos o mesmo resultado
  visual pondo a hero image de destino como `background-image` na cortina (DOM).

## O que se mantém (infra já existente no branch)

Não se toca em:

- Soft-nav (Astro ViewTransitions + prefetch)
- Lenis com reinit por navegação
- Reveal-ao-rolar com reinit por navegação
- Leitura + preload da hero image de destino (`heroUrlFromDoc`, `preloadImg`)
- Regra de qualificação de links (header + `.btn`, mesma origem, outra página)
- Guardas de `prefers-reduced-motion`

## O que se remove / substitui

Apenas o **movimento** da cortina atual: o slide vertical (`translateY -100%→0→100%`)
e o seu timing. É substituído pelo wipe por `clip-path`. A plumbing de imagem e de
orquestração (fetch do doc, swap coberto, failsafe) mantém-se.

## A — Preloader (1.ª carga)

**Markup/estilo**
- Overlay branco fullscreen (`position:fixed; inset:0`), acima de tudo, scroll
  travado (Lenis parado, sem scroll no body).
- Contador grande no canto inferior-esquerdo, texto `0`→`100`.
- Barra preta de 4px no topo, `transform-origin:left`, `transform: scaleX(0)→scaleX(1)`,
  `will-change: transform`, a espelhar o contador.

**Comportamento do contador (tipo-referência)**
- Sobe depressa e **segura nos 99** até os assets estarem prontos (`window.load`
  / imagens da hero carregadas), depois salta a `100`.
- **Teto de tempo (~2,5s):** se o load demorar/estagnar, força `100` e prossegue —
  nunca fica preso num site que carrega instantâneo.

**Saída**
- Aos 100: o overlay branco sai com o **mesmo wipe para cima** (`clip-path`,
  ease `wipeFront`).
- A hero entra a seguir com o reveal de baixo para cima já existente.

**Disparo**
- Só na 1.ª carga real. Gate por flag de sessão (`sessionStorage`) para não repetir.
- Soft-nav (swap sem reload) não o dispara por natureza.

## B — Cortina entre páginas

Elemento persistente (`transition:persist`), `position:fixed; inset:0; z-index:90`,
com `background-image` = hero image da página de destino. `will-change: clip-path`.

Ao clicar num link que qualifica:

1. **Cobre** — a hero image de destino entra por wipe de baixo para cima até tapar
   o ecrã (`clip-path` a fechar: `inset(100% 0 0 0)` → `inset(0 0 0 0)`), ease
   `wipeFront`; a imagem materializa-se (fade `opacity 0→1`) enquanto o wipe sobe.
2. **Troca** — a página troca por baixo (coberta), `scrollTop` ao topo, Lenis reinit.
   Failsafe existente: se `astro:page-load` não disparar em 5s, navegação direta.
3. **Revela** — a cortina continua o wipe para cima e sai pelo topo
   (`inset(0 0 0 0)` → `inset(0 0 100% 0)`), revelando a hero real da página nova.
   Como a imagem é a mesma, a cortina "derrete" sem costura na hero verdadeira. O
   texto da hero entra a acompanhar (`revealHeroText` existente).

**Fallback** — sem hero image de destino: cor sólida (`curtain--solid`, já existe).

**Reduced motion** — `prefers-reduced-motion: reduce` → navegação direta, sem cortina.

**Parâmetros de movimento**
- Ease: `cubic-bezier(0.8, 0, 0.2, 1)`.
- Durações reconstruídas: ~800ms cobrir, ~800ms revelar (afinadas ao vivo contra a
  referência).
- Lenis: `stop()` antes de cobrir, `start()` depois de revelar.

## Ficheiros afetados

- `src/components/PageCurtain.astro` — trocar movimento (translateY → clip-path),
  ajustar CSS e keyframes; manter fetch/preload/orquestração.
- `public/styles.css` — CSS live: preloader (`.tlk`-equivalente, contador, barra),
  cortina (`clip-path`, `will-change`, z-index).
- `src/layouts/Base.astro` — incluir markup do preloader + script de arranque
  gated por sessão.
- `public/main.js` — se necessário, coordenar Lenis stop/start com o preloader.

## Fora de âmbito

- Camada WebGL da referência (substituída por `background-image` DOM na cortina).
- Redesenho de conteúdo/hero das páginas.
