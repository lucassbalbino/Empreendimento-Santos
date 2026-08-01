# Galeria editorial + lightbox — página de empreendimento

Data: 2026-08-01

Substitui a spec `2026-07-30-galeria-lightbox-empreendimento-design.md` (grid
bento), que nunca chegou a ser implementada. A parte do lightbox mantém-se
praticamente igual; o que muda é a forma como as fotos são apresentadas na
página: em vez de mosaico compacto, uma sequência editorial em scroll.

## Objetivo

A secção "Galeria" da página `/empreendimentos/[slug]`
(`src/pages/empreendimentos/[slug].astro:98-112`) mostra hoje uma grid uniforme
de 3 colunas, células 4:3, sem interação. Passa a ser uma sequência vertical de
peças de tamanhos e alinhamentos alternados — cada foto com espaço próprio —
com deriva de parallax e lightbox fullscreen ao clicar.

A razão para o formato editorial em vez de mosaico: só dois empreendimentos têm
fotos reais e são poucas (Valflores Terraces — 7 imagens no total; CLT — Centro
Logístico do Tojal — 3). Um mosaico com 3 fotos fica pobre; uma sequência
editorial dá protagonismo a cada imagem e encaixa no scroll interpolado (Lenis)
e no reveal já usados no resto do site.

Só afeta empreendimentos com `galeria` não vazia. Os restantes 15 continuam sem
esta secção, sem alterações.

## Dados

Sem alterações a `src/data/empreendimentos.json`. `galeria` continua a ser uma
lista de caminhos; **sem legendas e sem numeração** — decisão tomada. O array
percorrido é `[proj.imagem, ...proj.galeria]`, como já é hoje (`[slug].astro:33`).

## Layout — sequência editorial

Sequência vertical de peças sobre uma grelha de 12 colunas (a largura do
`.container`), com um padrão de 3 que se repete por índice `i` do array:

| `i % 3` | Peça | Colunas | Aspect ratio |
|---|---|---|---|
| 0 | `wide` | 1 – 12, a sangrar do container em ≥1200px (ver nota abaixo) | `16/9` |
| 1 | `right` | 6 – 12 (≈58% da largura) | `4/5` |
| 2 | `left` | 1 – 7 (≈50%), deslocada `-8vh` na vertical | `3/2` |

- O contraste de formato (panorâmica → retrato → paisagem média) é o que produz
  a leitura editorial; a alternância de alinhamento e o desencontro vertical da
  peça `left` evitam que se leia como grid.
- Espaçamento entre peças: `clamp(4rem, 8vh, 9rem)`.
- Sangria da peça `wide`: só a partir de 1200px, com `width: min(100vw - 2rem, 1400px)`
  centrada via `margin-inline: auto` e `max-width` maior que o container. Nunca
  pode causar scroll horizontal — o `html` já tem `overflow-x: clip`.
- Imagens com `object-fit: cover` a preencher a moldura.
- Distribuição resultante: Valflores (7 fotos) → wide, right, left, wide, right,
  left, wide (fecha em peça larga). CLT (3 fotos) → wide, right, left.

## Movimento

- **Reveal:** cada peça é revelável de baixo para cima com o padrão existente do
  `Base.astro` (fade + translateY). O stagger vem naturalmente do scroll, não é
  preciso delay por peça.
- **Parallax:** dentro de cada moldura a imagem tem `height: 115%` e desliza
  ~12% da sua altura ao longo da passagem pelo viewport, via
  `animation-timeline: view()`. A moldura usa `overflow: clip` (não `hidden`,
  que a tornaria scroll container e prenderia o progresso da `view()`).
  Sem suporte a `view()`, a imagem fica estática e centrada — degradação limpa.
- **Hover** (`@media (hover: hover)`): `transform: scale(1.03)` na imagem,
  `transition: transform .6s var(--ease)`, `cursor: zoom-in` na moldura.
- `prefers-reduced-motion: reduce`: sem parallax, sem reveal com movimento e sem
  scale no hover — mesmo padrão dos restantes componentes do site.

## Lightbox fullscreen

Overlay `position: fixed; inset: 0` sobre `var(--dark)`, no espírito do menu
mobile (`.nav.open .nav__list`) já existente.

- Percorre exatamente o mesmo array que a página mostra, na mesma ordem.
- Imagem centrada, `object-fit: contain`, `max-width`/`max-height` a caber no
  viewport com margem.
- Setas esquerda/direita: mesmo desenho SVG chevron do `DoubleSlider`
  (`dslider__arrow`), botões circulares, uma de cada lado. Loop circular.
- Contador `"3 / 7"` num canto (estilo `dslider__count`).
- Botão fechar `×` no estilo do `.emodal__close` do histórico, canto superior
  direito.
- Fechar: `Esc`, clique no botão, clique no backdrop (fora da imagem).
- Navegar: setas, teclado `←`/`→` (só com o lightbox aberto), swipe horizontal
  em touch (mesmo threshold `SWIPE_MIN` do `DoubleSlider`).
- Transições: fade do backdrop + `scale(.96) → scale(1)` na imagem,
  `var(--ease)`, ~300ms; cross-fade simples na troca de imagem. Nada disto com
  `prefers-reduced-motion: reduce`.
- Enquanto aberto: `body` com `overflow: hidden` e, se `window.__amsLenis`
  existir, `lenis.stop()` (`lenis.start()` ao fechar).
- Acessibilidade: `role="dialog"` `aria-modal="true"`; foco move-se para o botão
  fechar ao abrir e volta para a foto de origem ao fechar; botões com
  `aria-label`; cada foto da sequência é um `<button type="button">` com
  `aria-label` do género `Ver imagem 3 de 7`.

## Responsivo

- `≤1024px`: a peça `right` passa a colunas 4 – 12 e a `left` a 1 – 10 (mais
  largas, mantendo o desencontro); a `wide` perde a sangria e fica à largura do
  container. Offset vertical da `left` reduz para `-4vh`.
- `≤760px`: todas as peças passam a largura total do container, sem sangria e
  sem offset vertical; espaçamento entre peças cai para `clamp(2rem, 6vh, 3.5rem)`.
  Ordem = ordem do array. O lightbox mantém-se utilizável (swipe).

## Implementação

- Markup e script novos dentro da própria página
  `src/pages/empreendimentos/[slug].astro` — galeria e lightbox só existem
  nesta página, não há outro consumidor.
- Script vanilla JS, sem dependências novas. Padrão já usado no
  `DoubleSlider`/`historico`: função `setup()` idempotente (flag
  `dataset.lightboxBound` no root da secção), registada em
  `document.addEventListener('astro:page-load', setup)` **e** chamada de
  imediato, para sobreviver a soft-navs do Astro.
- Estado do lightbox em variáveis fechadas dentro do `setup()`, não em IDs
  globais.
- CSS novo em `public/styles.css` (o CSS live do site), a substituir o bloco
  `.gallery` atual (`styles.css:1181-1186`) e as respetivas regras responsivas
  (`styles.css:1194`, `styles.css:1213`).

## Ficheiros

| Ficheiro | Ação |
|---|---|
| `src/pages/empreendimentos/[slug].astro` | sequência editorial (peças com classe de variante por `i % 3`) em vez da grid; markup do lightbox (overlay, setas, contador, botão fechar) + `<script>` de setup/navegação |
| `public/styles.css` | substitui as regras `.gallery`/`.gallery__img` por `.egal*` (peças, aspect ratios, sangria, parallax, hover) + novo bloco `.lightbox*` + ajustes nos dois breakpoints |

## Fora de âmbito

- Alterar `src/data/empreendimentos.json` ou adicionar fotos novas.
- Legendas, numeração ou qualquer copy nova por imagem.
- Zoom/pan ou miniaturas dentro do lightbox.
- Tocar na secção "O empreendimento" (`split__media`) ou no hero — só a secção
  "Galeria" é afetada.
- Aplicar a secção a empreendimentos sem `galeria`.

## Critérios de aceitação

1. Na página do Valflores Terraces, a secção Galeria mostra 7 peças na ordem
   wide, right, left, wide, right, left, wide, com alinhamentos e formatos
   alternados; no CLT mostra 3 (wide, right, left).
2. Nenhuma peça provoca scroll horizontal em qualquer viewport, incluindo a
   sangria da peça `wide` acima de 1200px.
3. Ao passar pelo viewport, a imagem dentro de cada moldura deriva verticalmente
   sem que a moldura mostre faixas vazias em nenhum ponto do percurso.
4. Clicar em qualquer foto abre o lightbox nessa foto; setas, `←`/`→`, swipe e
   loop circular navegam por todas, com o contador correto.
5. `Esc`, botão fechar e clique no backdrop fecham o lightbox e devolvem o foco
   à foto de origem.
6. Com o lightbox aberto a página por trás não faz scroll (nativo e Lenis) e
   volta ao normal ao fechar.
7. Com `prefers-reduced-motion: reduce` não há parallax, scale de hover, nem
   fade/scale no lightbox.
8. Em viewport ≤760px a sequência é coluna única sem offsets e o lightbox
   continua utilizável em touch.
9. `npm run build` termina sem erros; os 15 empreendimentos sem `galeria` não
   mudam de comportamento.
