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

**Estado:** 13 registados · 3 corrigidos (P3, P5, P7)

---

## P1 · h1 de `/portfolio` e `/historico` sai 13% mais pequeno do que o desenhado

**Onde:** `public/styles.css` — `.section--flat-top .block-head .display{ font-size:clamp(2.5rem,6vw,4.6rem) }`

**Causa:** refactor anterior trocou `.display` por `.title-split` (via `BlockHead` → `TitleSplit`). A regra ficou a apontar para uma classe que já não existe no markup.

**Medido (1440px):** o h1 renderiza a **64px**; a regra pedia **73.6px**.

**Correção:** trocar `.display` por `.title-split` no seletor.

**Risco:** baixo, mas é mudança **visível** de tipografia — confirmar com o utilizador antes.

---

## P2 · O título do 1.º bloco entra sem animação

**Onde:** `public/styles.css` — `html.reveal-ready .section--flat-top .block-head :is(.display, .lead)` (e a regra `.is-entered` correspondente)

**Causa:** a mesma de P1 — o `<h1>` é `.title-split`, não `.display`.

**Efeito:** em `/portfolio` e `/historico` só o `.lead` faz o slide de entrada; o título aparece já assente.

**Correção:** `:is(.title-split, .lead)` nos dois seletores.

**Risco:** baixo. Repõe movimento hoje perdido. Resolve-se com P1 na mesma passagem.

---

## P3 ✅ CORRIGIDO · Caminho de imagem sem barra inicial em `equipa.json`

**Onde:** `src/data/equipa.json:2` — `"imagem": "images/team-pic.jpg"`

**Causa:** falta a `/` inicial. Todas as outras entradas usam `/images/…`.

**Efeito:** em `/equipa` resolve para `/equipa/images/team-pic.jpg` → 404. Afeta também `heroUrlFromDoc()` em `PageCurtain.astro`, logo a cortina de transição para essa página.

**Correção:** `"imagem": "/images/team-pic.jpg"`

**Risco:** nenhum.

---

## P4 · `--brown` definido e sem consumidor

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

## P8 · `.hero__title-page{ font-size }` sem efeito

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

## P13 · 🔴 A fonte de display do site nunca carrega — todos os títulos estão em fallback

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

---

## Como usar este registo

Depois de as Tasks 6–10 estarem fechadas:

0. **P13 primeiro** — é o único com impacto em todas as páginas. Precisa de uma decisão que não é técnica: a fonte existe e está licenciada, ou assume-se a Fraunces?
1. **Decidir P4** (o `--brown`) — precisa de escolha de desenho antes de qualquer código.
2. **Aplicar em bloco P3, P7, P8** — risco nulo, sem efeito visual.
3. **Aplicar P1 + P2 juntos** — mesma troca de seletor, mas **muda o aspeto**: confirmar antes.
4. **P5, P6, P9** — já são âmbito da Task 10.
5. **P10, P11** — acessibilidade pré-existente; merecem uma vaga própria, com decisão sobre o método.
6. **P12** — reavaliar só quando as fotografias reais substituírem os placeholders.
