# Galeria bento + lightbox — página de empreendimento

Data: 2026-07-30

## Objetivo

A secção "Galeria" da página `/empreendimentos/[slug]` (`src/pages/empreendimentos/[slug].astro:97-111`)
mostra hoje uma grid uniforme 3 colunas, células 4:3, sem interação. Substituir
por uma forma mais moderna de ver as fotos: grid em mosaico (bento) + lightbox
fullscreen ao clicar numa foto, com navegação entre todas as imagens do
empreendimento.

Só afeta empreendimentos com `galeria` não vazia nos dados (hoje: Valflores
Terraces — 7 imagens — e CLT — Centro Logístico do Tojal — 3 imagens). Os
restantes continuam sem esta secção, sem alterações.

## Grid — mosaico bento

Grid CSS de 3 colunas com `grid-auto-flow: dense`. A cada grupo de 5 imagens
(posição 1, 6, 11, … no array `galeria`), essa imagem ocupa uma célula 2×2
(dobro da largura e da altura); as restantes ocupam 1×1. O `dense` faz o
packing preencher os espaços automaticamente à volta das peças grandes.

```
CLT (3 fotos)                 Valflores (7 fotos)
┌────────┬───┐                ┌────────┬───┬───┐
│        │ 2 │                │        │ 2 │ 3 │
│   1    ├───┤                │   1    ├───┼───┤
│        │ 3 │                │        │ 4 │ 5 │
└────────┴───┘                ├───┬────┴───┴───┤
                               │ 7 │     6      │
                               └───┴────────────┘
```

- Base: `grid-template-columns: repeat(3, 1fr); grid-auto-rows: clamp(140px, 14vw, 220px); grid-auto-flow: dense; gap` igual ao valor atual de `.gallery`.
- `.gallery__img:nth-child(5n+1)` → `grid-column: span 2; grid-row: span 2;`.
- Imagens com `object-fit: cover` a preencher a célula (como hoje).
- Hover: leve `scale(1.04)` na imagem dentro da célula (`overflow: hidden` na
  célula para o zoom não vazar), `transition: transform .5s var(--ease)`;
  cursor `pointer`. Sem hover em touch (`@media (hover: hover)`).
- Responsivo:
  - `≤1024px` (breakpoint onde `.facts, .gallery` já viram `repeat(2,1fr)`):
    mantém-se `repeat(2, 1fr)`, e a peça grande (`span 2`) passa a ocupar as
    duas colunas — vira retângulo largo em vez de quadrado grande.
  - `≤760px` (breakpoint onde `.gallery` já vira `1fr`): todos os spans
    colapsam para `1 / 1` — stack de coluna única, ordem = ordem do array.

## Lightbox fullscreen

Overlay `position: fixed; inset: 0` sobre `var(--dark)`, no mesmo espírito do
menu mobile (`.nav.open .nav__list`) já existente no site.

- Percorre exatamente o array `galeria` (imagem principal + `proj.galeria`) —
  o mesmo que a grid mostra, na mesma ordem. Sem dados novos.
- Imagem centrada, `object-fit: contain`, `max-width/max-height` a caber no
  viewport com margem.
- Setas esquerda/direita: mesmo desenho SVG chevron do `DoubleSlider`
  (`dslider__arrow`), botões circulares, uma de cada lado da imagem. Loop
  circular (da última volta à primeira e vice-versa).
- Contador `"3 / 7"` num canto (estilo `dslider__count`).
- Botão fechar `×`, mesmo estilo do `.emodal__close` do histórico, canto
  superior direito.
- Interações para navegar/fechar:
  - Clique nas setas ou no contador não aplicável — só setas.
  - Teclado: `←` / `→` muda de imagem, `Esc` fecha (só quando o lightbox está
    aberto).
  - Clique no backdrop (fora da imagem) fecha.
  - Touch: swipe horizontal muda de imagem (mesma lógica de threshold do
    `DoubleSlider` — `SWIPE_MIN`).
- Transição de abertura/fecho: fade do backdrop + `scale(.96) → scale(1)` na
  imagem, `var(--ease)`, ~300ms. Troca de imagem dentro do lightbox: cross-fade
  simples.
- `prefers-reduced-motion: reduce`: sem fade/scale — aparece e troca
  instantaneamente (mesmo padrão dos outros componentes do site).
- Enquanto aberto: `body` com scroll bloqueado (`overflow: hidden` +, se
  `window.__amsLenis` existir, `lenis.stop()`; `lenis.start()` ao fechar).
- Acessibilidade: overlay com `role="dialog"` `aria-modal="true"`; foco move-se
  para o botão fechar ao abrir e volta para a foto clicada (`.gallery__img`)
  ao fechar; botões com `aria-label`.

## Implementação

- Markup e script novos dentro da própria página
  `src/pages/empreendimentos/[slug].astro` (galeria + lightbox só existem
  nesta página, não há outro consumidor — não justifica componente à parte
  ainda).
- Script vanilla JS, sem dependências novas. Segue o padrão já usado no
  `DoubleSlider`/`historico`: função `setup()` idempotente (flag
  `dataset.lightboxBound` no root da secção), registada em
  `document.addEventListener('astro:page-load', setup)` **e** chamada de
  imediato, para sobreviver a soft-navs do Astro.
- Estado do lightbox por instância da secção (não IDs globais), guardado em
  variáveis fechadas dentro do `setup()`, como no `DoubleSlider`.
- CSS novo em `public/styles.css` (CSS live do site), a seguir ao bloco
  `.gallery` existente.

## Ficheiros

| Ficheiro | Ação |
|---|---|
| `src/pages/empreendimentos/[slug].astro` | markup do lightbox (overlay, setas, contador, botão fechar) + `<script>` de setup/navegação; `.gallery__img` ganha `data-index` e `type="button"`/`role` para abrir o lightbox |
| `public/styles.css` | grid bento (`.gallery` + `nth-child(5n+1)` + responsivo) substitui as regras atuais de `.gallery`/`.gallery__img`; novo bloco `.lightbox*` |

## Fora de âmbito

- Alterar `src/data/empreendimentos.json` ou adicionar fotos novas.
- Zoom/pan dentro da imagem do lightbox (só contain, sem pinch-zoom).
- Miniaturas dentro do lightbox (decisão já tomada: só setas + teclado + swipe
  + contador, sem tira de thumbs).
- Pré-carregar todas as imagens da galeria de outros empreendimentos.
- Tocar na secção "O empreendimento" (`split__media`, imagem única) — só a
  secção "Galeria" é afetada.

## Critérios de aceitação

1. Na página de um empreendimento com `galeria` não vazia (Valflores Terraces,
   CLT), a secção Galeria mostra a grid em mosaico com uma peça grande a cada
   5 imagens, sem espaços em branco no meio do mosaico.
2. Clicar em qualquer foto da grid abre o lightbox fullscreen nessa foto.
3. Setas, teclado (`←`/`→`), swipe e loop circular navegam corretamente entre
   todas as fotos do empreendimento (imagem principal + galeria), com o
   contador a refletir a posição atual.
4. `Esc`, clique no botão fechar e clique no backdrop fecham o lightbox e
   devolvem o foco à foto que estava a ser mostrada na grid.
5. Com o lightbox aberto, a página por trás não faz scroll (scroll nativo e
   Lenis ambos bloqueados) e volta ao normal ao fechar.
6. Com `prefers-reduced-motion: reduce` ativo, não há fade/scale nem no
   abrir/fechar nem na troca de imagem.
7. Em viewport `≤760px` a grid colapsa para coluna única sem a peça grande
   distorcer o layout, e o lightbox continua utilizável em touch (swipe).
8. `npm run build` termina sem erros; nenhum outro empreendimento (sem
   `galeria`) muda de comportamento.
