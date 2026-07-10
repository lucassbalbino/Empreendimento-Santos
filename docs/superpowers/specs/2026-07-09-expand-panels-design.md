# Painéis expansíveis — dark section (TRACK RECORD)

Data: 2026-07-09

## Objetivo
Reproduzir o efeito da seção `#content-office` da referência (Oppenheim Group):
uma fileira de painéis estreitos com nome vertical; ao passar o pointer, o painel
apontado cresce e todos os outros encolhem, com transição suave.

## Escopo
- Novo componente `src/components/ExpandPanels.astro`.
- `src/pages/index.astro`: na `section--dark` (TRACK RECORD), substituir
  `<CardScroller cards={home.trackRecord.cards} dark />` por
  `<ExpandPanels cards={home.trackRecord.cards} />`. BlockHead da seção permanece.
- Reaproveita `home.trackRecord.cards` (5 itens: `title` + `meta`). Sem novo JSON.
- CSS adicionado a `public/styles.css`.

## Componente
Cada painel (`<article class="panel">`):
- Fundo `.ph--dark` (placeholder padrão do site) + gradiente bronze sutil por cima.
- Colapsado: nome vertical (`writing-mode: vertical-rl`) na base.
- Expandido: `title` em serif + `meta`, com seta bronze `→`.

## Comportamento (100% CSS, sem JS)
- Fileira flex; primeiro painel expandido por padrão (`.panel:first-child` recebe
  estado ativo). Técnica de hover:
  - `.panels .panel { flex: 1 1 0; transition: flex-grow }`
  - `.panel.is-active { flex-grow: 6 }`
  - `.panels:hover .panel { flex-grow: 1 }`
  - `.panels:hover .panel:hover { flex-grow: 6 }`
- Resultado: aberto por padrão; hover em qualquer painel o expande e encolhe os
  demais; transição via `--ease`.

## Responsivo
- Abaixo de ~720px: pilha vertical de cards de altura fixa, título horizontal
  legível, sem efeito de expansão (toque não tem hover).

## Tokens
Usa os existentes: `--dark`, `--dark-soft`, `--accent`, `--serif`, `--ease`, `--paper`.
