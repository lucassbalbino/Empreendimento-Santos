# Split-text por linha (line-mask reveal) — site-wide

**Data:** 2026-07-25
**Estado:** Aprovado (design) — pronto para plano de implementação

## Objetivo

Adicionar uma animação de *split text* por todo o site: cada bloco de texto de
secção parte-se **por linha** e cada linha desliza de baixo para cima a partir de
uma máscara (`overflow:hidden`), em cascata. "Pesada" no pedido original refere-se
à **cobertura** (o efeito em todo o lado). O movimento é pesado e cinemático —
mais lento e com mais assentamento que o reveal base do site (~1200ms, stagger
~150ms), e dispara **mais tarde** que o reveal base (o texto entra em frame só
quando já está bem dentro do ecrã).

## Decisões fechadas

- **Efeito:** *line mask reveal* — cada linha medida sobe (`translateY(110%)→0`)
  clipada por uma máscara. Só `transform` (regra da casa: animar só
  transform/opacity; aqui dispensa opacity porque a máscara já esconde).
- **Peso:** pesado e cinemático — duração ~1200ms, stagger ~150ms entre linhas,
  easing com desaceleração forte (`cubic-bezier(.16,1,.3,1)` — arranque rápido,
  assentamento demorado).
- **Gatilho tardio:** o line-split usa um IntersectionObserver **próprio**, com
  margem inferior mais negativa que o reveal base, para o texto só entrar quando
  já está bem dentro do ecrã (não logo à beira de baixo).
- **Direção:** de baixo para cima (coerente com o reveal existente).
- **Biblioteca:** `split-type` (dep npm pequena), pela medição robusta de linhas,
  suporte a markup inline (links/`<strong>` dentro de parágrafos) e re-split no
  resize. O projeto já usa npm (Lenis).

## Âmbito — o que anima

**Entra no line-split (texto de secção):**
- `.eyebrow`
- Headings de secção: `.display` (h1/h2 fora da hero), `h2`, `h3`
- `.lead`
- Parágrafos de prosa de secção: `.split__body > p`, `.quemsomos__intro > p`

Nota: eyebrows e headings `h2` que estão **diretamente** na secção (ex.: o
`.eyebrow` + `h2` antes dos verticais) fazem line-split; o que está **dentro** de
cards não (ver a seguir).

**Fica de fora (deliberado):**
- **Hero** (`.hero__title-page` / h1 da hero, eyebrow da hero) — mantém a entrada
  própria via `revealHeroText()` da cortina (`PageCurtain.astro`). Aplicar
  line-split por cima lutaria com a coreografia da cortina.
- **Cards repetidos** (`.card`, `.stat`, `.member`, `.service`, `.vertical`) e
  media (`.reveal-wipe-lr`) — mantêm o *block reveal* atual (fade-rise do bloco),
  **incluindo o texto interno** (`.vertical h3/p`, etc.): não se faz line-split lá
  dentro, senão o bloco fazia fade-rise e a linha subia por cima (dupla animação).

**Regra anti-conflito:** os seletores de texto que passam a line-split são
**removidos** da lista `SEL` do reveal inline em `Base.astro`, para não haver
dupla animação (fade do bloco + subida da linha). O reveal inline continua a
tratar blocos/cards/media.

## Arquitetura

Novo módulo `src/scripts/split-reveal.js` (script de módulo, ao lado do Lenis no
`Base.astro`), importando `split-type`.

- Corre por `astro:page-load` — os elementos são novos a cada soft-nav
  (ViewTransitions), tal como os contadores e o reveal.
- Re-corre em `resize` (debounced) — a quebra de linha muda com a largura.
- É só mais um consumidor de IntersectionObserver, como os contadores. Não toca
  no Lenis nem na cortina.

## Mecânica (DOM + CSS)

Por elemento alvo:
1. `new SplitType(el, { types: 'lines' })` → gera um `.line` por linha medida.
2. Pós-passo: envolver o conteúdo de cada `.line` num `<span class="line__inner">`
   (o SplitType não traz máscara nativa; precisamos de duas camadas — a `.line`
   clipa, a `.line__inner` translada).
3. Atribuir `--i` (índice da linha) a cada `.line__inner` para o stagger.

CSS:
```css
.line { overflow: hidden; }
.line__inner {
  display: block;
  transform: translateY(110%);
  transition: transform 1.2s cubic-bezier(.16,1,.3,1);
  transition-delay: calc(var(--i) * 150ms);
}
.is-revealed .line__inner { transform: translateY(0); }
```

## Comportamento

- **Gatilho (tardio):** IntersectionObserver próprio com margem inferior mais
  negativa que o reveal base (ex.: `rootMargin: '0px 0px -25% 0px'`, contra os
  `-6%` do reveal) — o elemento só revela quando já subiu bem para dentro do
  ecrã. Ao entrar, adiciona `.is-revealed` → linhas sobem em cascata (~1200ms
  cada, stagger ~150ms).
- **Resize:** debounce → `split.revert()` + re-split + re-wrap. Se o elemento já
  estava revelado, repor visível **sem** re-animar (capturar o estado antes de
  reverter e reaplicar `.is-revealed` sem transição, ex.: forçar reflow ou aplicar
  o estado final imediatamente).
- **Reduced-motion / sem IntersectionObserver:** não parte nada — texto normal.
- **Progressive enhancement:** se o script falhar ou não correr, o texto fica
  legível na mesma. O estado escondido (`translateY(110%)`) só se aplica a
  elementos que o `split-type` já processou (ex.: gate por uma classe adicionada
  pelo JS, tipo `.split-ready` no elemento, à imagem de `reveal-ready`).

## Integração com o sistema existente

- **Reveal inline (`Base.astro`):** mantém-se para blocos/cards/media; perde os
  seletores de texto de secção (movidos para o line-split).
- **Lenis / cortina:** não são tocados.
- **Contadores (`main.js`):** independentes; sem interação.

## Verificação

Testar no browser em **aba visível** (a aba oculta suspende IO/transições/rAF —
validar por classe, não por estilo computado):
- Cada página: entrada em cascata por linha ao rolar até ao texto.
- Resize: re-medição das linhas sem partir o layout nem re-animar o que já estava
  visível.
- `prefers-reduced-motion: reduce`: line-split desligado, texto normal.
- Navegação por cortina: hero intacta (entrada própria), texto das secções
  seguintes a fazer line-split normalmente.
- Sem flash de texto escondido na 1.ª pintura (gate `.split-ready`).

## Fora de âmbito

- Line-split na hero (fica à cortina).
- Line-split dentro de cards repetidos.
- Split por caractere ou por palavra (escolhido: por linha).
- Mudar o timing/peso do reveal ou da cortina existentes.
