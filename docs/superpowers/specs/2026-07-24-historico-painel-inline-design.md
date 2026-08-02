# Histórico — modal → painel inline (acordeão estilo Sixt)

**Data:** 2026-07-24
**Página:** `src/pages/historico.astro`

## Objetivo

Substituir a janela modal (`#emodal`, overlay fixo com backdrop) que abre ao clicar
num empreendimento concluído por um **painel de detalhe inline**, inserido na própria
grelha de cards (`.grid-projects`), à maneira da listagem de carros da Sixt: o painel
abre por baixo da linha do card clicado, ocupa a largura toda e empurra o resto para
baixo. O conteúdo/layout é o mesmo da modal atual.

## Comportamento (decidido com o utilizador)

- **Acordeão na linha:** o painel abre logo por baixo do card clicado, à largura da
  linha inteira. Só um aberto de cada vez.
- **Conteúdo igual à modal atual:** imagem grande + título + chips à esquerda; estado
  + resumo + factos + entrega + botão à direita.
- **Toggle:** clicar de novo no card já aberto fecha o painel.
- **Scroll suave** até ao painel ao abrir (respeitando `prefers-reduced-motion`).
- **Botão × no painel** (além do toggle) e **Escape** fecham.
- **Sem** estado visual de "card ativo".

## Problema técnico central

Numa grelha de 3 / 2 / 1 colunas (`repeat(3,1fr)`, `repeat(2,1fr)` a partir de ~900px,
`1fr` no mobile), para o painel abrir por baixo da **linha inteira** sem deixar buracos,
tem de ser inserido no DOM logo a seguir ao **último card da mesma linha** do card
clicado — posição que muda com o número de colunas.

**Solução — deteção de linha por `offsetTop`:** um único painel reutilizável; ao abrir,
percorrer os cards, achar o último com o mesmo `offsetTop` do card clicado e inserir o
painel a seguir a esse, com `grid-column: 1 / -1`. Independente do número de colunas.
Reposicionar no `resize` enquanto estiver aberto.

Alternativas descartadas: hardcodar 3/2/1 (frágil); fechar no resize em vez de
reposicionar (pior UX).

## Marcação (`src/pages/historico.astro`)

- Remover o wrapper `.emodal` (fixed), o `.emodal__backdrop` e o lock `html.emodal-open`.
- Manter **um** painel reutilizável (`#epanel`) com a mesma estrutura interna
  (`.emodal__media` + `.emodal__info`: título, chips, resumo, factos, entrega, botão, `×`).
  Fica destacado/escondido; o JS insere-o na grelha ao abrir.
- Manter o `<script type="application/json" id="emodal-data">` e a função `fill(p)`.

## Estilo (`public/styles.css`)

- Novo `.epanel` (`grid-column:1/-1`) + `.epanel__inner` (grelha 2 colunas, herdando as
  regras do antigo `.emodal__dialog`).
- Reutilizar `.emodal__media / __info / __chip / __fact / ...` (estilizam o conteúdo).
- Abertura suave via `grid-template-rows: 0fr → 1fr` com `overflow:hidden`;
  **instantâneo** em `prefers-reduced-motion`.

## Interações / JS

- **Clicar no card:** se for o que está aberto → fechar (toggle); senão → `fill(p)`,
  inserir na linha, animar abertura, scroll suave.
- **× / Escape:** fechar.
- **Scroll:** `window.__amsLenis?.scrollTo(painel, { offset, duration })` com fallback
  `scrollIntoView`; instantâneo/auto em reduced-motion.
- Depois de mudar a altura, chamar `lenis.resize()` para o Lenis acompanhar a nova
  altura da página.

## Ficheiros

- `src/pages/historico.astro` — marcação + reescrita do bloco `<script>`.
- `public/styles.css` — estilos `.epanel` (repurpose do bloco `.emodal`).
