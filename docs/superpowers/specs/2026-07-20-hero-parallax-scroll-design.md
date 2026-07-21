# Hero — Transições ao scroll (referência: kononenkogroup.com)

**Data:** 2026-07-20 (atualizado 2026-07-21)
**Estado:** Home implementada; Sobre Nós pendente

## Objetivo

Transições na hero e na página "Sobre Nós" no estilo editorial de estúdio de
arquitetura (ref. kononenkogroup.com): imagem **estática na rolagem**, estética
minimal, fotografia full-bleed.

Nota: iterámos por parallax e por zoom (Ken Burns) antes de fixar na direção
final abaixo, escolhida pelo utilizador.

## Direção final — Sticky reveal

A imagem da hero fica **fixa ao viewport** (`position: sticky; top:0`) enquanto o
conteúdo seguinte sobe por cima e a cobre, como uma cortina sobre uma imagem
parada. A imagem **nunca se move**; o título e o indicador "Scroll" ficam com
ela e são cobertos de baixo para cima.

### Mecanismo (CSS puro)

- `body.is-home .hero { position: sticky; top: 0; z-index: 0; }`
- Conteúdo pós-hero envolvido em `.home-reveal { position: relative; z-index: 1;
  background: var(--paper); }` — camada opaca que sobe e cobre a imagem, e
  garante que a imagem só é visível na hero (nunca por trás das secções).
- Sem JavaScript. Só a Home (`body.is-home`), para não afetar heros internas.

### Verificação (Home)

Confirmado no browser via medições (screenshots da extensão instáveis nesta
página):
- `scrollY 400`: `.hero` pinned em `top:0`; `.home-reveal` subiu de 631→231px
  (conteúdo a cobrir a imagem). `elementFromPoint` y=120 → hero; y=500 → conteúdo.
- `scrollY 2500`: hero ainda `top:0` mas totalmente coberta (y=120 → secção,
  não a imagem) — sem bleed-through.

Gotcha registado: `body{ overflow-x:hidden }` força `overflow-y:auto`, mas como
o body tem altura automática o sticky funciona à mesma (verificado).

## Ficheiros

- `public/styles.css` — bloco sticky reveal junto aos `.hero*`.
- `src/pages/index.astro` — wrapper `.home-reveal` à volta do conteúdo pós-hero.

## Pendente — Sobre Nós

Replicar o hero sticky em `src/pages/sobre-nos.astro` e tornar as imagens
grandes das secções (Quem Somos 4:5, Serviços) em pin/sticky enquanto o texto
ao lado desliza.
