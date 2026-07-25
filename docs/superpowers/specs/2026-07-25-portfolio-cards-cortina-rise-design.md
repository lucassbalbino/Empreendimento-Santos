# Animação de entrada dos cards do portfólio — cortina branca + subida estilo Lenis

**Data:** 2026-07-25
**Âmbito:** página `src/pages/portfolio.astro` (as duas secções de projetos)

## Objetivo

Dar aos cards do portfólio uma animação de entrada em que cada card **sobe de baixo
para cima e emerge de trás do fundo branco da secção**, como se o branco fosse uma
cortina de onde o card sai. O movimento tem a fluidez desacelerada do scroll do Lenis
(easing forte, ~1,2s).

A primeira linha (visível ao abrir a página) sobe assim que a página aparece; as
linhas seguintes sobem à medida que entram no ecrã com o scroll.

## Mecanismo escolhido

Máscara por card + `translateY(100%) → 0`, disparada pelo reveal existente.

- Cada `<ProjectCard>` é envolvido numa moldura `.card-rise` com `overflow:hidden`.
- O card começa uma altura inteira abaixo (`translateY(100%)`), logo escondido atrás
  do fundo branco que a moldura deixa ver.
- Ao ganhar `.is-visible`, o card desliza até `translateY(0)`, emergindo pelo bordo
  inferior da moldura.
- O card mantém-se **opaco** durante a subida (`opacity:1`); é a máscara que o esconde.
  Lê-se como cortina, não como fade.
- **O fundo branco não anima.** Não há cortina branca a deslizar: o branco é o fundo
  estático da secção, visível através da moldura. O único elemento em movimento é o
  card. O "efeito cortina" é inteiramente a subida dos cards.

### Porquê máscara e não `clip-path`

Os comentários no `styles.css` já migraram deliberadamente *para fora* de `clip-path`
por custo de repintura (era "o item mais caro do site"). A máscara com `translateY`
corre no compositor da GPU, sem repintar cada frame. Mantemos essa decisão.

## Gatilho — reutilizar o reveal existente

O `IntersectionObserver` inline do `Base.astro` já observa `.card` e adiciona
`.is-visible` quando o elemento entra no viewport (`threshold:0.12`,
`rootMargin:'0px 0px -6% 0px'`), com fail-safe por scroll. Esse comportamento dá
exatamente o pedido:

- cards no viewport ao carregar → `.is-visible` imediato → sobem ao abrir;
- cards abaixo da dobra → `.is-visible` ao rolar → sobem à medida que entram.

**Não é preciso JS novo de deteção nem alterar `Base.astro`.** A `.is-visible` continua
a cair no `.card` interno; o CSS da subida lê `.card-rise .card.is-visible`.

## "Efeito Lenis"

O Lenis é scroll interpolado — não se aplica a um elemento isolado. A *sensação* Lenis
reproduz-se com uma transição lenta e de desaceleração forte:

- `transition: transform 1.2s cubic-bezier(.16,1,.3,1)` (expo-out) no card interno.

## Cascata por coluna

Dentro de cada linha, um pequeno atraso por coluna faz o trio entrar da esquerda para
a direita:

- coluna 1 (`:nth-child(3n+1)`): 0ms
- coluna 2 (`:nth-child(3n+2)`): 90ms
- coluna 3 (`:nth-child(3n+3)`): 180ms

Aplicado via `transition-delay` na `.card-rise:nth-child(...)`. Em breakpoints de 2/1
colunas o padrão degrada de forma benigna (os cards continuam escalonados; as linhas
são reveladas por scroll na mesma).

## Problema do hover e a sua resolução

O hover dos cards do portfólio faz `translateY(-6px)` + sombra grande
(`0 20px 44px -20px`). Uma moldura `overflow:hidden` permanente **cortaria** essa
elevação e a sombra.

Resolução: um mini-script reabre a moldura depois de a subida terminar.

- Ao `transitionend` do `transform` do card interno, adiciona-se `.is-open` à moldura.
- `html.reveal-ready .card-rise.is-open{ overflow:visible; }` — a partir daí o hover
  funciona normalmente.
- Corre uma só vez por card (o reveal também é one-shot: o IO faz `unobserve`).

## Reduced-motion

Tudo gated por `html.reveal-ready`, que o `Base.astro` **não liga** em
`prefers-reduced-motion: reduce`. Nesse caso:

- não há estado inicial `translateY(100%)` nem `overflow:hidden` (as regras estão sob
  `html.reveal-ready`), portanto os cards nascem já assentes e visíveis;
- o mini-script deteta a ausência de `reveal-ready` e adiciona `.is-open` de imediato,
  garantindo `overflow:visible` (irrelevante para o hover, que já está desativado em
  reduced-motion pela regra existente, mas mantém a consistência).

## Ficheiros a alterar

### `src/pages/portfolio.astro`

1. Envolver cada card:
   ```astro
   <div class="card-rise">
     <ProjectCard proj={p} />
   </div>
   ```
   A `.card-rise` passa a ser o item de grelha (filho direto de `.grid-projects`).

2. Adicionar script inline (corre em `astro:page-load`) que:
   - para cada `.card-rise`, se `html` não tem `reveal-ready` → `.is-open` imediato;
   - caso contrário, no `transitionend` (propertyName `transform`) do card interno →
     adiciona `.is-open` à moldura.

### `public/styles.css`

Bloco novo, scoped a `.card-rise` (não toca no `.reveal-mask` partilhado nem na regra
genérica de reveal):

```css
/* Entrada dos cards do portfólio: sobem de trás do fundo branco (cortina) */
html.reveal-ready .card-rise{ overflow:hidden; }
html.reveal-ready .card-rise .card{
  display:block;
  opacity:1;
  transform:translateY(100%);
  transition:transform 1.2s cubic-bezier(.16,1,.3,1);
  will-change:transform;
}
html.reveal-ready .card-rise .card.is-visible{ transform:translateY(0); }
/* cascata por coluna (grelha de 3) */
html.reveal-ready .card-rise:nth-child(3n+2) .card{ transition-delay:.09s; }
html.reveal-ready .card-rise:nth-child(3n+3) .card{ transition-delay:.18s; }
/* reabrir a moldura depois da subida, para o hover (elevação + sombra) não ser cortado */
html.reveal-ready .card-rise.is-open{ overflow:visible; }
```

Notas de especificidade: `html.reveal-ready .card-rise .card` = (0,3,1) **empata** com a
regra genérica `html.reveal-ready :is(… .card …)`, que também é (0,3,1) — porque `:is()`
assume a especificidade do seu argumento mais específico (`.section .eyebrow` = (0,2,0)),
não a de `.card`. O empate é resolvido por **ordem de origem**: como este bloco vem depois
no ficheiro, vence, e estes cards usam a subida grande (`translateY(100%)`, opacos) em vez
do reveal genérico de 26px com fade.

Cascata: o reveal geral do `Base.astro` escreve um `transition-delay` **inline** em cada
`.card` (índice de irmão = 0, pois o `.card` é filho único da moldura → `0ms`), e inline
vence qualquer selector. Por isso as delays da cascata levam `!important`.

### `src/layouts/Base.astro`

Sem alterações.

## Fora de âmbito (YAGNI)

- Não se altera o reveal dos cards no resto do site (mantêm os 26px + fade).
- Não se afina a cascata por breakpoint (2/1 colunas) — o comportamento degradado é
  aceitável.
- Não se toca no `PageCurtain` (cortina de troca de página) — é outro sistema.

## Critérios de sucesso

1. Ao abrir `/portfolio`, os cards da primeira linha sobem de baixo para cima,
   emergindo de trás do branco, em cascata esquerda→direita.
2. Ao rolar, cada linha seguinte faz a mesma subida quando entra no ecrã.
3. Depois de assentarem, o hover dos cards (elevação + sombra) funciona sem corte.
4. Em `prefers-reduced-motion: reduce`, os cards aparecem já assentes, sem movimento.
5. Nenhuma outra página muda o seu reveal.
