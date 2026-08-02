# Double slider — secção Portfolio da home

Data: 2026-07-20

## Objetivo

Substituir a secção PORTFOLIO da home (hoje `BlockHead` + `CardScroller`) por um
slider duplo fiel à referência `https://custom-double-slider.webflow.io/`, com
altura reduzida face ao original (a referência ocupa 100vh). A secção dá dois
caminhos de navegação: para a página de cada empreendimento
(`/empreendimentos/[slug]`) e para a página geral `/portfolio`.

## Referência

Estrutura observada no site de referência (verificada no browser):

- Slide de fundo full-bleed: imagem + nome em caixa alta com letter-spacing largo
  + uma linha de descrição, ao centro.
- Fila de miniaturas no canto inferior direito com os **próximos** slides, cada
  uma com legenda no canto inferior direito, sangrada (cortada) pela borda direita.
- Dois botões circulares de seta à esquerda dessa fila.
- Texto gigante em marca d'água ("LET'S TRAVEL") no canto inferior esquerdo, atrás.
- Botão circular de play ao centro (não aplicável aqui — não há vídeos).

## Layout

Secção full-bleed (fora do `.container`), fundo `--dark`,
altura `clamp(560px, 76vh, 740px)`.

```
┌───────────────────────────────────────────────────────────┐
│ — Portfolio                              Ver portfólio →  │
│                                                           │
│              V A L F L O R E S                            │
│         Loures · T2 e T3 · 24 frações                     │
│              → Ver empreendimento                         │
│                                        ┌─────┐┌─────┐     │
│ EMPREENDI…              ( ← ) ( → )    │ IMG ││ IMG │ ⟶   │
└───────────────────────────────────────────────────────────┘
```

Elementos:

- **Faixa superior**: botão `home.portfolio.botao` ("Ver portfólio") →
  `/portfolio` à direita.
- **Imagem de fundo**: `object-fit: cover` com gradiente escuro por cima para
  garantir contraste do texto branco.
- **Bloco central**: nome do empreendimento em caixa alta,
  `font-size: clamp(2rem, 6vw, 5rem)`, `letter-spacing: .14em`; por baixo a linha
  `localizacao · tipologia · unidades`; por baixo o botão de texto
  `→ Ver empreendimento` (estilo `.btn` sobre fundo escuro) → `/empreendimentos/[slug]`.
- **Watermark**: `home.portfolio.title` em maiúsculas, gigante, canto inferior
  esquerdo, cortado pela borda, `rgba(255,255,255,.06)`, `pointer-events: none`,
  `aria-hidden="true"`.
- **Fila de thumbs**: canto inferior direito, mostra os próximos empreendimentos
  na ordem do slider, com o nome no canto inferior direito de cada uma; a fila
  sangra para fora da borda direita do ecrã. Clicar numa thumb salta para esse
  empreendimento.
- **Setas**: dois botões circulares de 48px à esquerda das thumbs. Loop circular —
  não há estado desativado.
- **Badge "Imagem provisória"**: mantém a convenção do `ProjectCard`, mostrado
  quando `imagemReal: false`.

Mobile (`< 900px`): a fila de thumbs esconde-se; ficam as setas centradas com um
contador `02 / 08`; título em `clamp(1.6rem, 8vw, 2.4rem)`; altura ~64vh.

## Dados

Novo helper em `src/utils/projetos.js`:

```js
/** Empreendimentos em destaque na home: em construção primeiro, depois em projeto. */
export function emDestaque(limite = 8) {
  return [...porGrupo('desenvolvimento'), ...porGrupo('futuro')].slice(0, limite);
}
```

Tudo continua derivado de `src/data/empreendimentos.json` — sem duplicação de
dados e sem seleção manual por slug.

## Comportamento

- **Sem autoplay.** Navegação manual (setas, thumbs, teclado, swipe), como na
  referência.
- **Transição**: cross-fade da imagem com zoom leve (`scale(1.06)` → `scale(1)`);
  texto entra com fade + translate curto.
- **`prefers-reduced-motion: reduce`**: troca direta, sem transição nem zoom.
- **Teclado**: ← / → mudam de slide quando o slider tem foco; setas e thumbs são
  `<button>` com `aria-label`.
- **A11y**: contentor com `aria-roledescription="carousel"`; slides inativos com
  `aria-hidden="true"` e `inert` para não apanharem foco.
- **Touch**: swipe horizontal muda de slide.
- O script vive dentro de `DoubleSlider.astro`, com estado por instância (query
  a partir do elemento raiz do componente, não por IDs globais).

## Ficheiros

| Ficheiro | Ação |
|---|---|
| `src/components/DoubleSlider.astro` | **novo** — markup + script do slider |
| `public/styles.css` | bloco `.dslider*` no fim (é o CSS live do site) |
| `src/utils/projetos.js` | adicionar `emDestaque()` |
| `src/pages/index.astro` | secção PORTFOLIO passa a `<DoubleSlider projetos={emDestaque()} />`; saem `BlockHead` e `CardScroller` dessa secção |
| `src/data/home.json` | remover `portfolio.lead` (deixa de ser usado) |
| `public/admin/config.yml` | remover o campo "Subtítulo" (`lead`) do objeto `portfolio` da home |
| `src/components/CardScroller.astro` | **apagar** — fica sem uso em todo o projeto |

`ProjectCard.astro` continua em uso e não é tocado. `BlockHead.astro` continua em
uso noutras secções e páginas e não é tocado.

## Fora de âmbito

- Autoplay do slider.
- Alterações à página `/portfolio` ou às páginas de detalhe de empreendimento.
- Substituição das imagens provisórias por fotografias reais.

## Critérios de aceitação

1. A home mostra a secção Portfolio como slider duplo, com imagem de fundo, nome
   central, thumbs dos próximos empreendimentos sangradas à direita, setas
   circulares e watermark no canto inferior esquerdo.
2. "Ver portfólio" (topo-direito) navega para `/portfolio`.
3. "Ver empreendimento" (bloco central) navega para a página do empreendimento do
   slide atual.
4. As setas, as thumbs, as teclas ← / → e o swipe mudam de slide, com a fila de
   thumbs sincronizada com o slide de fundo.
5. Com `prefers-reduced-motion: reduce` ativo não há transições nem zoom.
6. Em viewport `< 900px` as thumbs desaparecem e aparece o contador; nada
   provoca scroll horizontal na página.
7. `npm run build` termina sem erros e não sobra nenhuma referência a
   `CardScroller` no projeto.
