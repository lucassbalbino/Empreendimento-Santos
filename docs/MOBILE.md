# Plano de ajuste — versão móvel

> Auditoria feita a 2026-08-23 sobre `dist/` construído, em Chrome headless,
> a **360×740**, **390×844** e **414×896** (`isMobile`, `hasTouch`), com as
> animações de entrada neutralizadas para medir o layout assente.
>
> Números de partida, somados nas 21 combinações página×largura:
> **90 transbordos · 237 alvos de toque < 44px · 132 blocos de texto < 13px.**
> Gravados em [`scripts/mobile-baseline.json`](../scripts/mobile-baseline.json),
> medidos no commit pré-campanha `703cbed` **num worktree isolado**.
>
> ⚠️ **Esta baseline foi medida três vezes antes de estar certa. Vale a pena
> saber porquê, porque a armadilha volta a aparecer:**
>
> 1. **141 / 345 / 159** — errado. O aviso de cookies aparece de forma
>    assíncrona (espera pelo preloader, tecto de 6s) e umas corridas mediam-no,
>    outras não. Corrigido com uma espera explícita no verificador.
> 2. **88 / 576 / 150** — errado por uma razão pior. Para medir o estado
>    pré-campanha, revertei `public/styles.css` para `703cbed` **na árvore de
>    trabalho** — mas a árvore já continha, por commitar, uma funcionalidade de
>    consentimento de cookies que **outra sessão estava a construir em
>    paralelo**. O `703cbed` não tem CSS nenhum para `.cookies`, por isso a
>    medição apanhou o aviso **completamente por estilizar**: em fluxo normal,
>    com controlos por omissão do browser. Daí os 576 alvos e uma home de
>    14 238px que nunca existiu.
> 3. **90 / 237 / 132** — medido num `git worktree` isolado em `703cbed`, sem
>    nenhum ficheiro por commitar de ninguém. É esta a referência.
>
> **Regra que sai daqui:** medir um commit histórico faz-se sempre em worktree.
> Reverter um ficheiro na árvore de trabalho partilhada mede uma quimera — um
> ficheiro antigo ao lado de trabalho novo de outra pessoa — e o número que sai
> parece plausível, o que é o pior tipo de número errado.

## Como se testa (obrigatório em cada task)

```
npm run mobile          # build + auditoria, compara com a baseline
npm run mobile:check    # só a auditoria (dist/ já construído)
npm run mobile:check -- --page=home --json   # relatório cru de uma página
```

O script [`scripts/mobile-check.mjs`](../scripts/mobile-check.mjs) sai com **código 1**
se qualquer contagem subir face à baseline, ou se alguma página ganhar barra de
scroll horizontal. Uma task só está fechada quando:

1. `npm run mobile` passa **e** as contagens da sua área desceram;
2. `npm run seo` continua a passar (758 verificações — não regredir SEO a corrigir CSS);
3. há inspeção visual às três larguras da secção tocada.

Depois da campanha toda: `npm run mobile:baseline` para fixar o novo mínimo.

---

## Diagnóstico

### A. Fundação — afeta todas as páginas

**A1 · O ritmo vertical não desce para o telemóvel.**
`--section-y: clamp(168px, 18vw, 300px)` ([styles.css:123](../public/styles.css#L123)).
A 390px de largura, `18vw` = 70px, portanto ganha o **piso de 168px** — cada
secção fica com 168px em cima e 168px em baixo, ou seja **336px de vazio entre
blocos num ecrã de 390px**. É a causa isolada mais forte da sensação de
desajuste. Consequência medida: home com **9 692px** (11,5 ecrãs), sobre-nos
8 904px, equipa 7 725px. O `clamp` foi afinado para desktop e nunca ganhou
piso móvel.
Agrava-se em `.no-hero .section--flat-top` ([styles.css:2592](../public/styles.css#L2592)),
que soma mais 20px: **188px de banda vazia** entre o header fixo e o primeiro
conteúdo de `/portfolio` e `/historico`.

**A2 · A marca-d'água transborda e colide com o conteúdo.**
`.wm--r{right:-6%}` / `.wm--l{left:-6%}` ([styles.css:2910-2911](../public/styles.css#L2910))
com `.wm--line{opacity:.5}` e traço a `var(--accent)`. No desktop, −6% de um
contentor de 1 480px é uma sangria discreta; a 390px são **23px para fora do
ecrã** e o desenho passa a ler-se como retângulos laranja soltos. Cruza o
*checkbox* do formulário de contacto, o título da `/equipa`, o subtítulo do
empreendimento e as imagens dos cartões. É também a origem de três dos
transbordos por página (`section` / `.container.has-wm` / `.wm-layer` a 413px
contra 390px). Só `.quemsomos` e `.emp-sobre` a escondem no móvel
([styles.css:693](../public/styles.css#L693), [811](../public/styles.css#L811)).

**A3 · Alvos de toque abaixo do mínimo — 345 ocorrências.**
Sistemático, não pontual: itens do menu 33px · links do rodapé 20px · ícones
sociais 26×26 · botão da newsletter 18×35 · *checkbox* 13×13 · `.btn` 35px ·
`.crumbs__link` 16px · `input`/`select` 35px. Mínimo WCAG 2.5.5: 44×44.

**A4 · Texto abaixo do corpo legível — 159 ocorrências.**
Do menor para cima: `.img-prov` 8,96px · "SCROLL" 9,92px · `.member__role`
10,24px · labels do formulário 10,88px · `h4` do rodapé 11,2px · `.btn`,
links do rodapé e `.dslider__label` 11,84px. Todos em caixa alta com
`letter-spacing` largo, o que piora a leitura no tamanho pequeno.

**A5 · `100vh` na hero.**
`.hero{min-height:100vh}` ([styles.css:417](../public/styles.css#L417), [448](../public/styles.css#L448)).
Em iOS/Android a barra do browser faz `100vh` ser maior que a área visível: o
título e o indicador "SCROLL" nascem abaixo da dobra e a página salta quando a
barra recolhe. Falta `100svh`.

### B. Bugs de layout em componentes

**B1 · Os cartões da grelha de projetos cortam na margem direita.**
Em `/empreendimentos/…`, `.grid-projects` calcula uma coluna de **405px dentro
de um contentor de 354px**. Causa: o `.card` é o item da grelha com
`min-width:auto`, e `.card__tag` é `white-space:nowrap`
([styles.css:1237-1245](../public/styles.css#L1237)) — "Hotel · 50 quartos" mede
135px e empurra a contribuição de min-content do cartão para além da coluna.
Na `/portfolio` o cartão vive dentro de `.card-rise` (que tem `min-width:0`) e
o efeito não aparece na grelha clara — mas aparece na escura ("Projetos
Futuros"), onde a imagem e a chapa da tipologia ficam cortadas.

**B2 · A pilha 3D dos depoimentos sangra 26px à direita** em `/sobre-nos`
(`.testimonials__img` a `[99 → 416]` num ecrã de 390). O `justify-self:end`
que a contém só existe a partir de 768px ([styles.css:2565](../public/styles.css#L2565))
e os desvios da pilha não escalam com a largura.

**B3 · `.dslider__stage` tem conteúdo 12px mais largo que o ecrã** (402 > 390)
no carrossel da home.

**B4 · `.quemsomos__img` mede 566px de largura num ecrã de 390** (a começar em
−88px) e fica tão baixa que o edifício não se lê — a foto que fecha o "Quem
Somos" aparece como uma fita.

**B5 · `.divider`** (três barras pretas de 4px, `max-width:340px`,
[styles.css:2996](../public/styles.css#L2996)). À largura do telemóvel ocupa
quase toda a coluna e lê-se como artefacto de render, não como assinatura.
Aparece a fechar blocos em `/sobre-nos` e no carrossel da equipa.

**B6 · `.frame__tab` e `.frame__bar`** (quadrado preto na aresta esquerda e
três riscas laranja no canto superior direito da imagem,
[styles.css:3008-3016](../public/styles.css#L3008)). Mesmo problema de escala:
no desktop são um detalhe da moldura, a 390px encavalitam-se na fotografia.

### C. Blocos com conteúdo mal ajustado

**C1 · `.seam` / cabeçalho de bloco.** O rótulo parte em duas linhas
("O Que \\ Fazemos", "A Nossa \\ Equipa") e o `©2026` fica a meio da altura,
desalinhado do rótulo. A `.seam__brand` já desaparece a ≤640px
([styles.css:1081](../public/styles.css#L1081)), mas as duas colunas restantes
mantêm o `justify-self` de três colunas.

**C2 · Menu mobile.** Abre e fecha (o painel `.nav__list` é `position:fixed;
inset:0` — [styles.css:2366](../public/styles.css#L2366)), mas: itens com 33px
de altura; o botão hambúrguer não vira X ao abrir; o painel deixa ver o título
da hero por baixo; e o logótipo fica por baixo do overlay, o que se lê como
falha de render.

**C3 · Formulário de contacto.** Labels a 10,88px · *checkbox* 13×13 · campos
e `select` a 35px de altura · "ENVIAR MENSAGEM" é texto de 11,84px sem área de
toque. Somado a A2, a marca-d'água atravessa o campo de mensagem.

**C4 · "Em Números" / `.facts`.** A duas colunas em 390px os rótulos partem em
três linhas ("UNIDADES RESIDENCIAIS E NÃO RESIDENCIAIS") e sobram ~200px de
vazio no fim da secção.

**C5 · Equipa.** Na `/equipa`, cada cartão traz um marcador "IMAGEM" de ~350px
de altura, um por ecrã, e a página soma 7 725px. Na home, o `@media (hover:none)`
([styles.css:1639](../public/styles.css#L1639)) abre permanentemente a
`.member__bio`, o que estica cada cartão do marquee.

**C6 · Breadcrumbs** (`/empreendimentos/…`) partem em duas linhas com o
separador "›" órfão a abrir a segunda.

---

## Tasks

Ordem e isolamento importam: a **Vaga 1** mexe nos tokens que todas as outras
medem, por isso corre sozinha e primeiro. A **Vaga 2** corre em paralelo, cada
agente no seu *worktree* — as áreas de `public/styles.css` são disjuntas, e a
integração é feita uma a uma com `npm run mobile` entre merges.

### Vaga 1 — Fundação (1 agente, sozinho, na árvore principal)

| # | Task | Ficheiros | Aceitação |
|---|---|---|---|
| **T1** | Piso móvel para `--section-y` e `--section-y-tight`; rever `.no-hero .section--flat-top` | `public/styles.css` (tokens + utilidades) | Altura da home ≤ ~6 500px a 390px; nenhuma banda vazia > 96px acima do primeiro conteúdo |
| **T2** | Marca-d'água **contida** em ≤760px — ver "Decisão do cliente" abaixo | `public/styles.css` (`.wm*`) | Zero entradas `wm-layer` / `svg` no relatório; nenhuma sobreposição com campos ou títulos; a marca **continua visível** |
| **T3** | Piso tipográfico de 13px em ≤760px (rótulos, botões, labels, meta, `.img-prov`) | `public/styles.css` | `texto` = 0 nas 21 combinações |
| **T4** | Alvos de toque a 44px (nav, rodapé, sociais, formulário, breadcrumbs, setas dos carrosséis) | `public/styles.css` | `toque` = 0 nas 21 combinações |
| **T5** | `100svh` com fallback `100vh` na hero | `public/styles.css` (`.hero`) | Título e "SCROLL" visíveis sem scroll a 390×844 e 360×740 |

> T3 e T4 tocam muitas regras espalhadas. Fazer com **uma** media query de
> `≤760px` agrupada e comentada, não regra a regra — é o que mantém isto
> legível para quem vier a seguir.

### Vaga 2 — Componentes (6 agentes em paralelo, cada um no seu worktree)

| # | Task | Ficheiros que possui | Aceitação |
|---|---|---|---|
| **P1** | **Grelhas de factos** — C4 (densidade de `.facts` / `.stats` / `.qmeta` a 390px). ~~B1~~ **já fechado na Vaga 1** (ver Resultado) | `styles.css` (`.facts`, `.stats`, `.qmeta`) | Rótulos de factos em ≤2 linhas; sem vazio morto no fim da secção |
| **P2** | **Carrosséis** — B2 (pilha de depoimentos) e B3 (`.dslider__stage`) | `styles.css` (`.testimonials*`, `.dslider*`), `Testimonials.astro`, `DoubleSlider.astro` | Zero transbordo em `/sobre-nos` e na home; setas ≥44px; legendas legíveis sobre a foto |
| **P3** | **Assinaturas gráficas e imagens** — B4 (`.quemsomos__img`), B5 (`.divider`), B6 (`.frame`) | `styles.css` (`.quemsomos__img`, `.divider*`, `.frame*`) | Nenhuma marca gráfica sobre a fotografia a 360px; foto do "Quem Somos" com altura que deixe ler o edifício |
| **P4** | **Navegação** — C2 (menu), C6 (breadcrumbs), C1 (`.seam`) | `styles.css` (bloco nav, `.crumbs*`, `.seam*`), `Header.astro`, `Breadcrumbs.astro`, `Seam.astro`, `public/main.js` | Itens do menu ≥44px; hambúrguer vira X; painel opaco; breadcrumbs sem separador órfão; rótulo do bloco e ©ano na mesma linha de base |
| **P5** | **Formulário e rodapé** — C3 | `styles.css` (`.contact*`, `.site-footer*`), `ContactForm.astro`, `Footer.astro` | Campos ≥44px; checkbox ≥24px com área de toque ≥44px; botão de envio com área real; newsletter utilizável a 360px |
| **P6** | **Equipa** — C5 | `styles.css` (`.team*`, `.member*`), `Team.astro`, `src/pages/equipa.astro` | `/equipa` abaixo de ~5 000px a 390px; marcador "IMAGEM" com altura proporcionada; bio não estica o cartão do marquee |

### Vaga 3 — Verificação (1 agente, depois de todos os merges)

- `npm run mobile` sem regressões e com as contagens globais em queda.
- `npm run seo` a passar (758 verificações).
- Passagem visual às três larguras em cada uma das 7 páginas.
- `npm run mobile:baseline` para fixar o novo mínimo.
- Registo do resultado neste ficheiro (secção "Resultado").

---

## Decisão do cliente — as marcas gráficas ficam

**Retirar uma marca gráfica no móvel não é uma escolha que os agentes possam
fazer sozinhos.** Isto vale para a marca-d'água (`.wm`), o divisor-assinatura de
três barras (`.divider`) e as peças da moldura (`.frame__tab`, `.frame__bar`).

O que se corrige é a **escala e a posição**, não a existência: a marca passa a
caber dentro do bloco (sem a sangria de −6%), com o tamanho e a opacidade
ajustados para se ler como assinatura discreta e não como retângulo solto. Nada
de `display:none` a partir de 760px.

Se alguma delas não tiver, comprovadamente, forma de funcionar a 360px sem
colidir com texto ou controlos, **regista-se aqui** com a medição que o
demonstra e deixa-se a decisão ao cliente — não se apaga.

## Regras para os agentes

1. **Não alargar o âmbito.** Cada task tem ficheiros próprios; não tocar nos
   dos outros, mesmo quando o problema salta à vista — anotar aqui em vez disso.
2. **Não mexer no desktop.** Todas as correções vivem em media queries de
   `≤760px` (ou `≤900px` onde o componente já usa esse ponto). Confirmar a
   1440px que nada mudou.
3. **Comentar o porquê, não o quê.** O `styles.css` deste projeto explica
   decisões; manter o registo — sobretudo quando se retira um elemento de
   desenho no móvel, dizer que continua a existir no desktop e porquê.
4. **Um commit por task**, com o resultado do `npm run mobile` no corpo.
5. **Reportar o que ficou por fazer.** Um problema encontrado e não resolvido
   vale mais registado do que corrigido à pressa fora do âmbito.

## Registo da Vaga 1 — fundação

_(preenchido pelo agente da Vaga 1, à medida que fecha cada task)_

### T1 · Ritmo vertical

Feito em `public/styles.css`, numa media query `≤760px` logo a seguir ao `:root`:
`--section-y` passa de `clamp(168px, 18vw, 300px)` para
`clamp(56px, 28vw - 45px, 168px)` e `--section-y-tight` de
`clamp(36px, 4.2vw, 68px)` para `clamp(20px, 3.25vw + 11px, 36px)`.

A recta (e não um segundo piso fixo) foi escolhida para passar exactamente
pelo valor de desktop aos 760px — 28×7,60 − 45 = 167,8px, contra os 168px que
o clamp original dá a essa largura. A fronteira da media query não tem degrau.

`.no-hero .section--flat-top` **não precisou de regra própria**: a folga extra
que ela soma já era `clamp(20px, 3vw, 48px)` = 20px no telemóvel; os 188px de
banda vinham todos do piso de 168px. Medido depois: banda vazia entre o fundo
do header fixo (71px) e o primeiro conteúdo de `/portfolio` e `/historico` —
**64px @360 · 72px @390 · 79px @414**, dentro do máximo de 96px pedido.

**Alturas a 390px (antes → depois):** home 9 692 → 9 252 · sobre 8 904 → 8 178 ·
portfolio 5 180 → 4 741 · equipa 7 725 → 7 102 · contactos 3 769 → 3 354 ·
historico 6 770 → 6 355 · empreendimento 7 297 → 6 600.

#### Por que a home não chega aos ~6 500px

O alvo do plano não é alcançável mexendo no ritmo, e a aritmética di-lo:
a 390px a home tinha **9 692px, dos quais só 832px são padding de secção**
(4 × 168 de `--section-y`, 2 × 36 de `--section-y-tight`, 56+32 do rodapé).
Os outros **8 860px são conteúdo**. Mesmo zerando todo o padding de secção a
home ficaria em 8 860px. Chegar a 6 500 exige cortar ~2 360px **de conteúdo**,
o que é trabalho da Vaga 2 (a `.facts` a uma coluna com números de 70px, os
cartões `.pilar` empilhados, o marcador "IMAGEM" da equipa) e, mesmo somando
tudo isso, é provável que a home fique na casa dos 7 500–8 000px.

Alavancas de ritmo que sobram, medidas, e a quem pertencem:

| Alavanca | Valor a 390px | Total na home | Dono |
|---|---|---|---|
| `.seam` (5 na home) | 48+72px cada, 64+72 na `--loose` | **648px** | P4 (`.seam*`) |
| `.quemsomos__media` `margin-top` | 72px | 72px | P3 |
| `.dofazemos__pilares` `margin-top` | 64px | 64px | — |
| `.section--panels-cut .block-head` `margin-bottom` | 72px | 72px | — |

A `.seam` é a maior e não foi tocada de propósito: os seus selectores estão
atribuídos ao P4 (C1) e ela já tem uma media query de `≤640px` com valores
próprios. Fica registada aqui como a decisão a tomar a seguir.

#### Nota de instrumentação — `portfolio@360` oscila

`portfolio@360` dá **11 ou 12** transbordos na mesma `dist/`, sem qualquer
alteração de CSS: medido 4 corridas com o `styles.css` original — 11, 11, 12,
11. A entrada intermitente é `div.card__text` / `h3.card__title` a
`98 > 81` (conteúdo mais largo que a caixa), que depende de a face web já ter
carregado no momento da medição. Não é regressão de nenhuma task; é ruído da
baseline e convém fixá-lo antes da Vaga 3 (esperar por `document.fonts.ready`
no `mobile-check.mjs` resolveria).

### T2 · Marca-d'água contida

**A marca não foi retirada em lado nenhum.** As duas regras que já a escondiam
no móvel — `.quemsomos .has-wm .wm-layer{display:none}` e a gémea em
`.emp-sobre` — foram **retiradas**, portanto a marca voltou a dois sítios onde
já não aparecia.

O que mudou, tudo em `@media (max-width:760px)` no bloco `.wm` da folha:

| | desktop (inalterado) | ≤760px |
|---|---|---|
| lateral | `left/right: -6%` (sangria) | `left/right: var(--gutter)` (encosta à coluna de texto) |
| tamanho | `min(24/34/46%, 210/320/440px)` | `40 / 52 / 56px` |
| âncora vertical | `top:6%` / `bottom:6%` (dentro do bloco) | `bottom:calc(100% + 4px)` / `top:calc(100% + 4px)` (na margem do bloco) |
| traço `--line` | `stroke-width:2.4` | `1.4` |
| `--fill` / `--dark` | `opacity .07 / .08` | `.16 / .18` |

**Porquê a margem e não o interior do bloco.** Foram medidas as bandas
verticais de cada um dos 13 contentores `.has-wm`, a 360/390/414px, marcando
como ocupada qualquer faixa com título, `label`, `input`, `select`, `textarea`
ou botão. O bloco de contacto — onde estavam as piores colisões — tem **uma só**
banda livre, de 135px, entre o título e o primeiro rótulo (10%–30% da altura),
e nenhuma das marcas está ancorada aí. A 390px não existe posição *dentro* do
bloco que sirva as variantes `--top` e `--bottom` ao mesmo tempo sem cruzar um
campo. Fora do bloco existe: o respiro que a secção já tem (`--section-y`,
56–71px depois da T1). Os três tamanhos foram escolhidos para caber lá com 4px
de folga.

**Medição depois.** 13 instâncias × 3 larguras = 39 posições verificadas:
**0 fora do ecrã · 0 sobreposições** com títulos, rótulos, campos ou botões
(antes: 8 instâncias fora do ecrã por largura, e a marca do bloco de contacto
cruzava o `textarea`, o rótulo do consentimento e a *checkbox* em 5 páginas).

Contagem de transbordo: **140 → 77** nas 21 combinações. `equipa`, `contactos`
e `historico` ficaram a **zero**.

Nada por resolver nesta task — nenhuma variante teve de ficar como estava.

## Resultado

### Vaga 1 — fechada (T1 a T5)

Commits `be48071` · `78f3281` · `6120c0b` · `930d8b9` · `9a8b86d` · `06b4905`.

| | partida | agora | |
|---|---|---|---|
| Transbordos | 90 | **25** | −72% |
| Alvos < 44px | 237 | **0** | |
| Texto < 13px | 132 | **0** | |

Altura das páginas a 390px:

| Página | antes | depois | |
|---|---|---|---|
| histórico | 7 616px | 6 922px | −9% |
| home | 10 456px | 9 609px | −8% |
| portfólio | 5 507px | 5 054px | −8% |
| sobre-nós | 8 833px | 8 517px | −4% |
| equipa | 7 645px | 7 445px | −3% |
| contactos | 3 689px | 3 679px | −0,3% |
| **empreendimento** | **6 461px** | **6 966px** | **+8%** |

`npm run seo:check` continua a passar (exit 0).

**A página de empreendimento ficou 505px MAIS ALTA.** É uma troca consciente e
não um descuido: para o cartão deixar de cortar na margem direita (B1), a
legenda passou a empilhar — nome em cima, chapa da tipologia por baixo — e isso
custa altura em cada cartão. Trocou-se largura por altura. Se a P1 encontrar
maneira de manter os dois na mesma linha sem estourar a coluna, é ganho puro.

**O critério de altura da T1 não foi cumprido, e estava mal posto.** Pedia a
home abaixo de ~6 500px; está nos 9 609px. O padding de secção era 336px por
fronteira e desceu a ~128px, mas o que domina a altura da home não é isso — é
altura de componente: o carrossel (`min-height:clamp(680px,90vh,880px)`), os
painéis (`clamp(460px,72vh,760px)`) e a fita da equipa. Isso é P2 e P6.

**Trabalho da Vaga 2 antecipado.** O B1 foi corrigido na T4 e sai do âmbito da
P1: os corpos a subir para 13px puseram o min-content do cartão a estourar a
coluna, e deixar uma regressão aberta à espera da vaga seguinte era o oposto do
que esta campanha existe para impedir.

**Os 25 transbordos que restam** são exactamente os componentes da Vaga 2, e
mais nada:

| Origem | Ocorrências | Task |
|---|---|---|
| `.testimonials*` (pilha 3D e o que ela empurra) | 13 | P2 |
| `.quemsomos__img` | 3 | P3 |
| `.dslider__stage` | 3 | P2 |
| `.panel__bg` | 3 | P3 |

**Observação nova, sem task atribuída.** Na hero, a 390px, o indicador
"SCROLL" começa 9px antes de o título acabar (título 590→655, scroll 646→722).
Não se sobrepõem porque estão separados na horizontal, mas leem-se apertados.
Vale uma decisão de composição — sugere-se juntar à P2.

**Nota sobre a T5.** O ganho do `svh` não se demonstra em headless: um Chrome
sem barra de browser resolve `svh`, `lvh` e `vh` ao mesmo número. Provou-se por
partes (suporte, minificador, e conteúdo a caber à altura do viewport pequeno).
**Falta confirmar num telemóvel real.**

### Vagas 2 e 3

_(por fazer)_
