# Portfólio: fade branco na entrada + cards revelam mais cedo

**Data:** 2026-07-25
**Âmbito:** APENAS a página do portfólio. Nenhuma outra página muda.

## Objetivo

1. Ao navegar para o portfólio, trocar o **wipe preto** da cortina de transição por
   um **fade branco simples** (branco esbate → cards sobem). Sem preto.
2. Os **cards do portfólio** revelam **mais cedo** no scroll (enquanto ainda assomam
   pelo fundo do ecrã), sem alterar o reveal global do resto do site.

## Restrição-chave

O utilizador pediu explicitamente: **não mudar a estrutura das outras páginas, só a do
portfólio.** Por isso:
- O `IntersectionObserver` global do reveal em `Base.astro` **não se toca**.
- As mudanças na cortina são scoped ao caminho "sólido" (`.curtain--solid`), que só é
  atingido pela única página sem hero — o portfólio. As outras páginas (com hero) caem
  no caminho com imagem, que fica **igual**.

## Parte A — Cards do portfólio revelam mais cedo (só portfólio)

O reveal partilhado (`Base.astro`) dispara quando o elemento já entrou ~6%
(`rootMargin: '0px 0px -6% 0px'`). Não o alteramos.

Em vez disso, no script inline que já existe em `portfolio.astro`, adiciona-se um
`IntersectionObserver` **dedicado aos cards do portfólio** com margem antecipada:

- `rootMargin: '0px 0px 15% 0px'`, `threshold: 0` → dispara ~15% **antes** de o card
  entrar no ecrã.
- Ao intersectar, adiciona `.is-visible` ao `.card` interno e faz `unobserve`.
- Gated: só corre se `IntersectionObserver` existe **e** `html.reveal-ready` está ligado
  (respeita reduced-motion — aí os cards já nascem assentes).

O reveal global continua a observar os mesmos cards, mas o observer dedicado dispara
primeiro; `classList.add('is-visible')` é idempotente, sem conflito. O stagger da
cascata (`!important`, ver [[reveal-escreve-transition-delay-inline]]) mantém-se.

## Parte B — Fade branco em vez do wipe preto (só portfólio)

### JS (`src/components/PageCurtain.astro`, dentro de `run()`)

Ramo por `solid = !url` (sem imagem de destino = portfólio):

- **Sólido (portfólio) → fade branco:**
  - A cortina cobre por **fade de opacidade** (0→1), mantendo `clip-path` totalmente a
    tapar (`inset(0 0 0 0)`), em vez do clip-wipe.
  - Troca o DOM por baixo (igual: `navigate` + espera `astro:page-load`).
  - Revela por **fade de opacidade** (1→0). Como o portfólio por baixo é branco e a
    cortina é branca, o esbatimento é sem costura; a seguir os cards sobem (reveal deles).
  - Duração curta: `FADE = 420` ms cada lado.
  - Implementado com `curtain.animate([...], {fill:'forwards'})` em ambos, keyframes com
    `clipPath: COVERED` fixo e `opacity` a variar — para o `finally` existente
    (`getAnimations().forEach(cancel)`) repor a cortina ao repouso do CSS.
- **Com imagem (todas as outras páginas) → inalterado:** o clip-wipe atual, tal e qual.

O `revealHeroText()` e a espera de 2 rAF já saem cedo/são inócuos no portfólio (sem hero).

### CSS (`public/styles.css`, bloco da cortina)

- `.curtain--solid` passa de escuro a **branco**: `background: var(--paper)` (e o
  `.curtain--solid .curtain__img` a `var(--paper)`), em vez de `var(--dark)`.
- **Header durante o fade branco:** hoje as regras `body:has(#page-curtain.curtain--active)
  …` forçam o header a texto claro (a contar com fundo escuro) e levantam-no acima da
  cortina (`z-index:10000`). Num fundo branco isso ficaria invisível. Solução: limitar
  essas regras a `:not(.curtain--solid)`. No caminho sólido o header **não** é levantado
  → a cortina branca cobre-o durante o fade; quando esbate, aparece o header normal
  (creme) do portfólio. Sem problemas de contraste, sem regras de cor novas.

## O que NÃO muda

- Reveal global (`Base.astro`) — intacto.
- Wipe das páginas com hero — intacto.
- Card-rise (subida de trás do branco), cascata, `is-open`, reduced-motion — intactos.
- A elevação do hover suprimida site-wide (decisão pendente à parte) — fora de âmbito.

## Critérios de sucesso

1. Ao clicar para o portfólio (vindo de qualquer página): fade branco curto, **sem preto**,
   depois os cards sobem.
2. O header não pisca invisível durante o fade (fica coberto e reaparece creme).
3. Os cards do portfólio revelam claramente mais cedo do que antes ao rolar.
4. Navegar entre duas páginas **com hero** continua com o wipe de imagem atual, sem
   qualquer mudança.
5. Reduced-motion: sem cortina (regra existente) e cards já assentes.

## Verificação

A transição de página é difícil de validar na aba automatizada (oculta → observer/rAF
suspensos, ver [[browser-verify-hidden-tab]]). Valida-se o que der por classes/estilos
computados e `npm run build`; a confirmação visual da transição fica para o utilizador
em aba de 1.º plano.
