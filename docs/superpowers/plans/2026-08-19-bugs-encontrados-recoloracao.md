# Bugs encontrados durante a recoloração — registo e soluções

> Registo vivo, aberto a 2026-08-19 durante a execução do plano
> [2026-08-18-paleta-terrosa-identidade.md](2026-08-18-paleta-terrosa-identidade.md).
>
> **O que está aqui:** defeitos **fora do âmbito cromático** que apareceram no
> caminho — pré-existentes, ou de tipo diferente (tamanho, movimento, dados,
> acessibilidade não-cromática). Cada um com causa, medição e a correção
> proposta, para serem tratados **em bloco no fim** das implementações.
>
> **O que NÃO está aqui:** os defeitos de cor apanhados em revisão e já
> corrigidos durante a execução (© da seam escura, `.stat__num`,
> `.member__role`, acento sobre `--paper-warm`, CLS do logótipo). Esses estão
> resolvidos e documentados nos respetivos commits.

**Estado:** 22 registados · **14 fechados** (P1, P3, P4, P5, P7, P8, P13, M2,
M3, M4, M5, M6, M7, M8 — mais a metade factual do M9) · 2 diagnósticos
revistos (**P13** e **P2**, ambos estavam errados) · **6 por fechar**

**Commits:** `71a9806` (M2) · `7fdb477` (registo) · `181194c` (P8, M5, M8, M9
parcial) · `43b121e` (M3, M4) · `6e16cef` (M6, M7)

---

## P1 ✅ FECHADO · h1 de `/portfolio` e `/historico` sai 13% mais pequeno do que o desenhado

**Onde:** `public/styles.css` — `.section--flat-top .block-head .display{ font-size:clamp(2.5rem,6vw,4.6rem) }`

**Causa:** refactor anterior trocou `.display` por `.title-split` (via `BlockHead` → `TitleSplit`). A regra ficou a apontar para uma classe que já não existe no markup.

**Medido (1440px):** o h1 renderiza a **64px**; a regra pedia **73.6px**.

**Correção:** trocar `.display` por `.title-split` no seletor.

**Risco:** baixo, mas é mudança **visível** de tipografia — confirmar com o utilizador antes.

---

## P2 · O título do 1.º bloco entra sem animação

**Onde:** `public/styles.css` — `html.reveal-ready .section--flat-top .block-head :is(.display, .lead)` (e a regra `.is-entered` correspondente)

> ⚠️ **Corrigido a 2026-08-19.** A descrição e a correção que aqui estavam
> estavam **ambas erradas**. Ver abaixo.

**Causa:** a mesma de P1 — o `<h1>` é `.title-split`, não `.display`.

**~~Efeito:~~** ~~só o `.lead` faz o slide de entrada; o título aparece já assente.~~

**Efeito real:** o título **anima**. O `src/scripts/split-reveal.js:29` tem
`'.section .title-split__text'` no seletor, e `.section--flat-top` traz também
a classe `section` (`portfolio.astro:22`, `historico.astro:34`) — portanto o
`<h1>` é partido em linhas e revelado pelo IntersectionObserver como qualquer
outro título do site.

O que se perdeu é mais subtil: o slide pesado de **1.9s coordenado com a
cortina** (gated por `.is-entered`, que o script da página só põe depois de a
cortina levantar). Hoje o título anima com o reveal genérico, disparando por
conta própria à carga. É uma perda de *coreografia*, não de movimento.

**~~Correção:~~** ~~`:is(.title-split, .lead)` nos dois seletores.~~ ❌ **Não
aplicar.** Colaria `opacity:0 !important; transform:translateY(80px)
!important` num elemento cujas linhas interiores já estão mascaradas e a
animar. Resultado: animação dupla, e o `opacity:0 !important` mantém o título
**invisível** até `.is-entered` mesmo depois de o line-reveal ter corrido — ou
seja, troca uma perda de coreografia por um título que pode não aparecer.

**Correção correta:** ou excluir o `.title-split` do `split-reveal.js` (para o
gate `.is-entered` voltar a ser o único dono da animação do `<h1>`), ou mudar
o gate. **Não** é uma troca de seletor.

**Risco:** médio, e é trabalho de animação, não de cor. Separar de P1 — P1 é só
`font-size` e resolve-se sozinho.

---

## P3 ✅ CORRIGIDO · Caminho de imagem sem barra inicial em `equipa.json`

**Onde:** `src/data/equipa.json:2` — `"imagem": "images/team-pic.jpg"`

**Causa:** falta a `/` inicial. Todas as outras entradas usam `/images/…`.

**Efeito:** em `/equipa` resolve para `/equipa/images/team-pic.jpg` → 404. Afeta também `heroUrlFromDoc()` em `PageCurtain.astro`, logo a cortina de transição para essa página.

**Correção:** `"imagem": "/images/team-pic.jpg"`

**Risco:** nenhum.

---

## P4 ✅ FECHADO · `--brown` definido e sem consumidor

**Onde:** `public/styles.css` — `:root`

**Causa:** a dose conservadora escolhida pelo utilizador não executou o "castanho em detalhes" da Task 4 Step 3.

**Efeito:** token que não pinta um único píxel. A Task 9 exportá-lo-ia para o Figma como se estivesse em uso.

**Correção — decisão do utilizador:** (a) **aplicar** a ícones dos `socials`, molduras e bordas de `.facts`; ou (b) **remover**; ou (c) **manter documentado como reserva**.

---

## P5 ✅ CORRIGIDO · `.section--accent` — bloco morto

**Onde:** `public/styles.css` (~127–133) e `html.reveal-ready body.is-home .section--accent::after`

**Causa:** a faixa laranja de contadores foi retirada do desenho (ver comentário em `src/pages/index.astro`: *"o laranja vive nos números, em toda a página, em vez de saturar uma só secção"*).

**Verificado:** `grep -rn "section--accent" src/` não devolve nada.

**Correção:** remover. **Já é a Task 10 Step 2** — fica aqui só para o registo ficar completo.

> ⚠️ **Não confundir com `.stat*`**, que está **vivo** (`Stats.astro` → `/sobre-nos`). O plano original dizia que era morto; foi corrigido em execução.

---

## P6 · Prop `palette` órfã

**Onde:** `src/layouts/Base.astro` — constrói `palette-${palette}` no `bodyClass`

**Causa:** servia o andaime de teste da paleta (`palette="test-b46511"`), removido na Task 1.

**Efeito:** nenhuma página passa `palette`. Código morto.

**Correção:** remover o parâmetro e a construção da classe, **ou** manter como ponto de extensão (é barato e legítimo para futuros temas).

---

## P7 ✅ CORRIGIDO · Cor de marca hardcoded na marca-d'água escura

**Onde:** `public/styles.css` — `.wm--dark .bar, .wm--dark .tab{ fill:#f2efe9 }`

**Causa:** pré-existente. Está a **um dígito** de `--paper-alt` (`#f2ece3`).

**Efeito:** viola a constraint *"nunca hardcodar cor de marca"*. Nenhuma task do plano o cobre.

**Correção:** `fill:var(--paper-alt)`.

**Risco:** nenhum — a diferença é imperceptível a `opacity:.08`.

---

## P8 ✅ CORRIGIDO · `.hero__title-page{ font-size }` sem efeito

**Onde:** `public/styles.css`

**Causa:** anulado por `.title-split--hero`, de igual especificidade e mais abaixo na folha.

**Correção:** remover a regra (ou fundir com `.title-split--hero`, se o valor pretendido for o dela).

**Risco:** nenhum — já não faz nada hoje.

---

## P9 · `.section--alt .fact` redundante

**Onde:** `public/styles.css` — `.section--alt .fact{ background:var(--paper) }`

**Causa:** existia para contrariar um `#ffffff` hardcoded. Depois da Task 3 e da Task 4 ficou idêntica à regra base `.fact{ background:var(--paper) }`.

**Correção:** remover — **ou** manter se se decidir dar `--paper-warm` ao `.fact` base (aí volta a ter função). Ver P4.

---

## P10 · Falhas AA pré-existentes no chrome da hero

**Onde:** `public/styles.css` — `.nav__list a`, `.hero__scroll`, `.hero__scroll .line`, `.emp-back`

**Causa:** texto branco semitransparente sobre fotografia clara. **Anterior a esta recoloração** — e a Task 5 melhorou todos os valores (o véu escureceu), mas não o suficiente.

**Medido depois da Task 5** (p95 = fundo mais claro realista sob o glifo):

| Elemento | Página | Rácio | Alvo |
|---|---|---|---|
| `.nav__list a` | home | 3.21:1 (p95 2.72) | 4.5 |
| `.nav__list a` | `/equipa` | 3.40:1 | 4.5 |
| `.hero__scroll` | `/equipa` | 3.72:1 | 4.5 |
| `.emp-back` | — | p95 2.41:1 | 4.5 |
| `.hero__scroll .line` | `/equipa` | 2.86:1 | 3.0 |

**Correção — opções:** (a) subir a opacidade destes elementos para 1; (b) acrescentar `text-shadow` de legibilidade, como o `.card__title` já usa; (c) reforçar o topo do véu da hero. **(b) é a menos invasiva** e não mexe na paleta.

---

## P11 · Linhas quase invisíveis sobre a secção de areia

**Onde:** `public/styles.css` — `.seam__rule` e o `border-bottom` de `.field input` dentro de `.section--alt`

**Medido:** `--line` sobre `--paper-alt` = **1.19:1** (era 1.13 — ligeiramente melhor com a paleta nova).

**Efeito:** relevante para **WCAG 1.4.11 (contraste de não-texto, alvo 3:1)** nos campos de formulário de `/historico`, onde a sublinha é a única indicação visual do campo.

**Correção:** um token `--line-strong` (~`#d6c8b2`, ≈1.6:1) para linhas sobre areia, **ou** usar `--ink-faint` a baixa opacidade nos campos de formulário. **Pré-existente**, não é regressão.

---

## P12 · Texto dos placeholders no limite

**Onde:** `public/styles.css` — `.ph::after`, `.testimonials__img--ph::after`

**Medido:** `--ink-faint` sobre `--paper-alt` **mais as riscas** `rgba(0,0,0,.035)` → pior caso **4.31:1** (era 2.40:1 — melhoria de 80%).

**Efeito:** abaixo de AA, mas é texto de placeholder ("Imagem"/"Foto") que **desaparece quando as fotos reais entrarem**.

**Correção:** nenhuma necessária se os placeholders forem temporários. Se ficarem, usar `--ink-soft`.

---

## P13 ✅ FECHADO · 🔴 A fonte de display não carrega — e a que existe **não serve para português**

> ⚠️ **Diagnóstico revisto a 2026-08-19.** O que está escrito a seguir descrevia
> o sintoma e presumia que a correção era repor o ficheiro. **Não é.** A
> investigação está na secção *"O que a investigação encontrou"*, no fim desta
> entrada — lê primeiro essa. O texto original fica para se perceber o percurso.



**Onde:** `public/styles.css` — `@font-face{ font-family:"Kompot Display"; src:url("/fonts/KompotDisplay.otf") }`

**Causa:** **`public/fonts/` existe mas está vazia.** O ficheiro `KompotDisplay.otf` nunca foi commitado (provavelmente ficou em `.gitignore` ou nunca foi adicionado).

**Verificado no browser:**
```
Kompot Display carrega: false
fontes no documento   : Fraunces (loaded), Inter (loaded), Kompot Display (error)
```

**Efeito:** o `.title-split` declara `"Kompot Display", var(--serif)`. Como o primeiro falha, **todos os títulos de secção e de hero do site renderizam em Fraunces** — a fonte de fallback. A identidade tipográfica desenhada nunca chegou a ser vista. Também gera um **404 em cada carregamento de página**.

**Nota:** isto explica por que razão o plano e vários comentários chamavam "títulos serif" ao `.title-split` — na prática **são** serif, porque a display não carrega.

**Correção:** adicionar `public/fonts/KompotDisplay.otf` ao repositório (e confirmar que não está a ser ignorado pelo `.gitignore`). Se a fonte não estiver licenciada para web, decidir entre licenciá-la ou assumir a Fraunces como face de título — e nesse caso **retirar o `@font-face` e a primeira entrada do `font-family`**, para deixar de haver um 404 por página.

**Prioridade: a mais alta do registo.** É o único item aqui com impacto em todas as páginas e na identidade visual.

### O que a investigação encontrou

**1. Não foi licença nem `.gitignore` — foi uma eliminação acidental.**

```
df9d03f  A  public/fonts/KompotDisplay.otf   ← adicionado
01c8d61  D  public/fonts/KompotDisplay.otf   ← apagado
```

O `01c8d61` é *"commiting, sobre nos o que fazemos section"* — trabalho noutra
secção. O ficheiro saiu à boleia. `.gitignore` só tem `node_modules/`,
`dist/`, `.astro/`.

**2. O ficheiro é recuperável — e é a demo.** Reposto de `df9d03f` para teste,
o md5 é **idêntico** ao de `referencias/fontes/kompot-display-demo.otf`. A
tabela `name` declara a família como **"Kompot Display Demo"**.

**3. E a demo não desenha português.** Testado por dois métodos independentes
que concordam — parser do `cmap` e deteção de fallback por glifo no motor real
(medir o caractere com `"Kompot", serif` e com `"Kompot", monospace`: se as
larguras batem, usou a Kompot nas duas):

| | Estado |
|---|---|
| `A-Z` `a-z` | ✅ completas |
| Dígitos | ⚠️ `0 1 · 3 4 · 6 7 · 9` — **faltam 2, 5, 8** |
| Pontuação `. , ? ! : — & ( )` | 🔴 **nenhuma** |
| Acentos | 🔴 **mapeados ao glifo da letra base** |

O último ponto é o que decide. Os codepoints acentuados **existem** no `cmap`
— por isso nenhum teste automático os dá como em falta — mas apontam para o
desenho da letra **sem acento**. Renderizado a 82px, `Á À Â Ã É Ê Í Ó Ô Õ Ú Ç`
sai `A A A A E E I O O O U C`: sem til, sem agudo, **sem cedilha**.

Na prática, com esta fonte reposta:

| Título | Como renderiza |
|---|---|
| SOBRE NÓS | SOBRE **NOS** |
| EDIFÍCIO BAIRRO DA VITÓRIA | **EDIFICIO** BAIRRO DA **VITORIA** |
| QUEM CONSTRÓI, TODOS OS DIAS | QUEM **CONSTROI**, … (vírgula em Fraunces) |
| CONDOMÍNIO SANTOS — MURTEIRA II | **CONDOMINIO** … (travessão em Fraunces) |

Não é um defeito cosmético de pontuação: é **erro ortográfico em todos os
títulos acentuados do site**, e o site é todo em português.

**4. O ficheiro de teste foi removido.** A árvore ficou como estava.

### Correção — decisão do utilizador

| Opção | O que implica |
|---|---|
| **(a) Licenciar a Kompot Display completa** | Única via para a identidade desenhada. A versão paga tem acentos, pontuação e dígitos. Repor a demo **não** substitui isto. |
| **(b) Assumir a Fraunces** (recomendada até haver (a)) | É o que o site já mostra hoje, em todas as páginas. Retirar o `@font-face` e a primeira entrada do `font-family` do `.title-split` — acaba o 404 por página e o CSS passa a dizer a verdade. **Zero alteração visual.** |
| **(c) Repor a demo** | ❌ Não recomendada. Troca um 404 por títulos sem acentos. |

**Nota:** a opção (b) é reversível numa linha e não fecha a porta à (a).

---

## Série M — encontrados na revisão final das Tasks 6–10 (2026-08-19)

Todos verificados de forma independente antes de entrarem aqui.

### M1 · O `site.webmanifest` nunca é lido

`grep -rn "webmanifest\|rel=\"manifest\"" src/ public/` → **zero**.
`Base.astro:25` só tem `<link rel="icon">`.

**Efeito:** a Task 8 é **inerte** na parte do PWA — o browser nunca abre o
ficheiro, logo `theme_color` e `background_color` não fazem nada. (O
`<meta name="theme-color">` no `Base.astro:26` esse funciona.)

**Correção:** `<link rel="manifest" href="/site.webmanifest">`. **Mas rever
antes o `background_color`:** está `#241a12` num site `color-scheme: only
light` cujo `body` é `--paper` — daria splash café a abrir para página branca.
Provavelmente quer ser `#fdfcfa`.

### M2 ✅ CORRIGIDO · Tokens `on-dark` prometidos ao Figma e inexistentes no CSS

Quatro nomes do `tokens-studio.json` sem contraparte no `:root`, e cinco hex à
mão no rodapé — um deles literalmente o `--paper-alt`. Mesmo defeito que o P7
fechou, no mesmo ramo. **Commit `71a9806`.** Verificado: 17/17 tokens batem, e
as cinco cores computadas do rodapé não mudaram.

### M3 ✅ CORRIGIDO · `design/figma-setup.md:90` ainda manda usar o laranja antigo

> *"Mantém a lógica da marca: **branco + preto + laranja** (`#ea5a17`)"*

É o guia que se lê **primeiro** para montar o Figma, e contradiz o styleguide
ao lado. **Correção:** `#b46511`, e alinhar a frase com a §1 do styleguide.

### M4 ✅ CORRIGIDO · O styleguide contradiz-se e descreve tipografia que não existe

- **§4 vs §5** — a §4 diz que a faixa de acento é legado e "não reconstruir";
  a §5 continua a listar *"faixa laranja de contadores"* nos componentes da
  Home. Além disso a §4 diz *"o CSS ainda tem as regras"* — a Task 10 removeu-as
  no commit seguinte.
- **§2 (tipografia)** — diz Fraunces 400/300, caixa mista, Display 66px. A
  produção é `.title-split`: `"Kompot Display"`, `700`, `uppercase`, até
  `5.6rem`. *(Ver P13: hoje cai para Fraunces, mas por defeito, não por
  desenho.)*
- **§3 (layout)** — container `1280px` vs `--maxw:1480px`; gutter "20→72px" vs
  `clamp(18px,3.4vw,52px)`; secção "72→150px" vs `clamp(168px,18vw,300px)`;
  `--card-radius:6px` não documentado; "contadores em 5 colunas" nunca
  renderiza (`/sobre-nos` usa `.stats--compact`, a home usa `.facts--contadores`).

**Correção:** uma passagem só. A §1 já foi corrigida pela Task 9; as outras não.

### M5 ✅ CORRIGIDO · `split-reveal.js:27` — terceiro órfão do refactor `.display`

`'.section .display, …'`. A classe tem **zero** ocorrências em `src/`.
Mesma causa de P1/P2, mas fora do CSS. **Correção:** remover do seletor.
**Risco: nenhum** — não corresponde a nada hoje.

### M6 ✅ CORRIGIDO · Placeholder do input da newsletter quase invisível

`styles.css` — `.news input` não declara `::placeholder`. O cinzento default
do UA (~`#757575`) sobre o fundo real `rgb(58,49,42)` dá **≈2.7:1**.
É o único campo do site sobre escuro.

**Correção:** `.news input::placeholder{ color:var(--on-dark-dim) }` → 4.77:1.

### M7 ✅ CORRIGIDO · A linha do campo da newsletter falha 1.4.11

`.news{ border-bottom:1px solid rgba(255,255,255,.25) }` = **2.21:1** sobre o
fundo real. É a única indicação visual do campo — mesmo problema do P11, mas
no escuro. **Correção:** subir para `rgba(255,255,255,.42)` (≈3.1:1).

### M8 ✅ CORRIGIDO · Comentário desatualizado em `styles.css:841`

Diz `#141414e5`; é `#241a12e5` desde a Task 3. Bloco `.seam--dark`.

### M9 ⚠️ METADE CORRIGIDA · Quadrado de acento nas seams — não planeado, e o comentário mente

Três commits mexeram na seam sem o declararem na mensagem: `5e5f5d2` (commit
do **rodapé**) criou `.seam__rule::before`, um quadrado ocre de 9px em **todas
as costuras do site**; `a632861` substituiu-o por `.seam__mark`; `f486ee3`
reverteu ao quadrado. Resíduo líquido: um elemento visual novo em todas as
seams, sem passo no plano.

Ainda bem que a Task 10 reverteu — senão o CSS (`.seam__mark`) e o markup
(`.seam__logo`) ficavam desalinhados e a marca da costura desaparecia.

**Correção:** decidir se o quadrado fica (é uma escolha de desenho, não um
bug) e corrigir o comentário de `styles.css:799-800`, que diz *"exatamente por
trás do logo"* — é falso: o logo vive em `.seam__meta`, que tem
`margin-top:2.6rem`. O quadrado está **sobre a régua**.

---

## Como usar este registo

### Decisões tomadas a 2026-08-19 — commit `0680f7d`

| # | Decisão | Resultado |
|---|---|---|
| **P13** | Assumir a Fraunces e excluir as referências à Kompot | Saem o `@font-face` e a família do `.title-split`. **Zero 404s** pela primeira vez. Fica nota histórica no styleguide: se a display completa for licenciada, é uma linha de CSS. |
| **P4** | Manter como reserva documentada | O comentário do `:root` passa a dizer que o token não tem consumidor **de propósito**, em vez de prometer usos que a dose conservadora não executou. |
| **P1** | Manter os 64px | Regra órfã removida, em vez de reposta com o seletor certo. |

### Ainda por decidir

| # | A decisão |
|---|---|
| **M1** | Ligar o manifest — e, se sim, rever o `background_color`: está `#241a12` e daria splash café a abrir para uma página branca. |
| **M9** | O quadrado ocre das seams fica ou sai? É escolha de desenho, não bug. |

### Por fazer, sem depender de ninguém

- **P9** — depois da decisão do P4, `.section--alt .fact` continua redundante e
  pode sair. Risco nulo.
- **P6** — a prop `palette` órfã: remover, ou manter como ponto de extensão.
- **P2** — **trabalho de animação, não de cor.** Ler o aviso na entrada antes
  de lhe tocar: a correção que lá estava originalmente partia o título.
- **P10 e P11** — acessibilidade pré-existente. Merecem vaga própria, com
  decisão sobre o método (o M7 já resolveu o equivalente no escuro).
- **P12** — reavaliar quando as fotografias reais substituírem os placeholders.

### Já fechados

P1 · P3 · P4 · P5 · P7 · P8 · P13 · M2 · M3 · M4 · M5 · M6 · M7 · M8
— e a metade factual do M9.
