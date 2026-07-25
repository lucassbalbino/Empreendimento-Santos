# Slide pesado na entrada do portfólio (1.º bloco)

## Objetivo

Depois do fade branco de entrada na página do portfólio, o **título (h1)** e os
**cards** da 1.ª secção fazem um slide "bem pesado": movimento longo, lento e
uniforme, com travagem firme no fim. A 2.ª secção ("Futuros") fica inalterada.

## Decisões (fechadas com o utilizador)

- **Caráter:** lento e uniforme, percurso grande, quase-linear com travagem no
  fim (não é inércia/easeOut forte, nem overshoot/ressalto).
- **Coreografia:** título arranca primeiro (t=0); os cards arrancam depois, com
  o título já quase a assentar, mantendo a cascata por coluna. Leitura de cima
  para baixo.
- **Âmbito:** só a 1.ª secção (`.section--flat-top`). A 2.ª (`.section--alt`,
  "Futuros") mantém o reveal atual ao rolar.
- **Arranque vs. fade:** o slide só arranca **depois de a cortina levantar**
  (fade branco terminado), para se ver o percurso completo. Em carga direta /
  refresh (sem cortina) arranca de imediato.

## Estado atual (ponto de partida)

- **Cards** (`.card-rise` em `public/styles.css`): sobem `translateY(100%) → 0`
  em `1.2s cubic-bezier(.16,1,.3,1)`, cascata por coluna (`+.09s / +.18s`).
  Disparados por `.is-risen`, adicionada pelo callback **assíncrono** do
  observer de `src/pages/portfolio.astro` (padrão que evita o salto em soft-nav).
- **Título** (`.block-head` → `.eyebrow/.display/.lead`): usa o reveal genérico
  do `Base.astro` — `.is-visible` síncrono, sobe apenas `26px`, transform `1.1s`.
  É leve e, por ser síncrono, saltaria se lhe déssemos um percurso grande.
- `section--flat-top` só existe na 1.ª secção do portfólio → seletores CSS
  scoped por essa classe são seguros (não afetam outras páginas).

## Valores propostos (afináveis no browser)

Easing partilhado (quase-linear com travagem): `cubic-bezier(.1,.25,.25,1)`.

- **Título** (`eyebrow/display/lead` da 1.ª secção):
  `translateY(80px) → 0`, opacidade `~.45s`, transform `~1.9s`, arranque a t=0.
- **Cards** (1.ª secção): `translateY(100%) → 0` (percurso máximo já existente),
  transform `~2s`, `transition-delay` base `~.8s` + cascata por coluna
  (`.8s / .9s / 1.0s`). Arranque efetivo ~0.8s depois do título.

## Mecanismo

### CSS (`public/styles.css`)

1. **Cards da 1.ª secção — versão pesada.** Regras scoped por
   `.section--flat-top` que sobrepõem duração e delay às regras genéricas de
   `.card-rise` (transform `2s`, delays `.8/.9/1.0s`). Reutiliza `.is-risen`
   para resolver `translateY(0)`. `transition-delay` com `!important` porque o
   reveal genérico do `Base.astro` escreve delay inline em cada `.card`
   (memória `reveal-escreve-transition-delay-inline`).

2. **Título da 1.ª secção — slide pesado.** Estado escondido
   (`opacity:0; translateY(80px)`) e resolução (`opacity:1; transform:none`)
   scoped por `.section--flat-top`, resolvido **só** pela classe `.is-entered`
   (adicionada por script depois da cortina). Precisa de `!important` para
   vencer o `.is-visible` genérico — que o `Base.astro` adiciona síncrono e que,
   sem isto, resolveria o título cedo (leve) e faria saltar (memória
   `reveal-soft-nav-salta-pre-paint`). Gated por `html.reveal-ready` → em
   reduced-motion o título aparece normal, sem transição.

### JS (`src/pages/portfolio.astro`)

O observer existente (`earlyIO`) passa a tratar **apenas** os `.card-rise` que
**não** estão na 1.ª secção (o 2.º bloco, revelado ao rolar). A 1.ª secção é
tratada por uma entrada dedicada:

- `fireFirstBlock()`: adiciona `.is-risen` aos `.card-rise` da 1.ª secção e
  `.is-entered` à `.section--flat-top` (dispara o título). Mantém o binding
  `transitionend` (propertyName `transform`) → `.is-open` para reabrir a
  moldura (`overflow:visible`) e a sombra do hover não ser cortada.
- **Gate da cortina:** se `window.__amsCurtainBusy` for `true` (navegação por
  cortina em curso), espera (poll curto) até voltar a `false` — i.e. o fade
  terminou — e só então chama `fireFirstBlock()`. Se for falsy (carga direta),
  dispara num `requestAnimationFrame` (garante que o estado escondido já pintou
  antes de resolver, senão a transição salta).
- Fora de `reveal-ready` (reduced-motion / sem IO): 1.ª secção entra já assente
  (`.is-risen` + `.is-open` + `.is-entered`), sem transição — como hoje.

`window.__amsCurtainBusy` já é definido pelo `PageCurtain.astro` (`true` no
início de `run()`, `false` no `finally`, depois do fade-out). Não é preciso
alterar o `PageCurtain`.

## Fora de âmbito

- 2.ª secção ("Futuros"): reveal atual inalterado.
- Comportamento da cortina / fade branco em si: inalterado.
- Outras páginas: não tocadas (seletores scoped por `section--flat-top`).

## Verificação

- No browser (aba visível, não oculta — memória `browser-verify-hidden-tab`):
  entrar no portfólio via navbar/botão (cortina) e confirmar que título e cards
  fazem o slide pesado **depois** do fade, com o título a assentar antes de os
  cards arrancarem, cascata por coluna preservada.
- Refresh direto em `/portfolio`: o slide arranca de imediato (sem cortina).
- 2.ª secção ao rolar: reveal como antes.
- `prefers-reduced-motion: reduce`: sem transições, tudo assente.
- Validar por **classe** (`.is-risen` / `.is-entered` / `.is-open`), não por
  estilo computado.
