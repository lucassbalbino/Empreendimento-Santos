# Paleta terrosa — recoloração global do site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o laranja vibrante `#ea5a17` pelo ocre queimado da marca real (`#b46511`, amostrado do logótipo HD) e **construir uma família de castanhos à volta dele** — superfícies de areia, tinta e títulos acastanhados, secções escuras em café — **mantendo o branco como base dominante do site**. Resultado pretendido: sóbrio, sério, com toque de luxo, sem ostentação.

**Princípio orientador (do utilizador):** *"mantenha grande parte sendo branco, mas quero incluir mais tons marrom"*. O castanho entra por **camadas secundárias** — secção alternada, linhas, títulos, superfícies pontuais e blocos escuros — **nunca** inundando a página. A base permanece branca.

**Architecture:** O site já centraliza a cor em *custom properties* no `:root` de `public/styles.css`. ~95% dos usos de acento passam por `var(--accent)` / `var(--accent-dk)`, logo a Task 1 sozinha vira quase tudo. As tasks seguintes (a) alargam a paleta com a família de castanhos, (b) tratam os **resíduos hardcoded** onde uma cor fria escapou ao sistema de tokens, e (c) sincronizam documentação e chrome do browser.

Ordem deliberada: **tokens primeiro** (efeito máximo, risco mínimo, reversível numa linha), **aplicação do castanho depois**, **resíduos e documentação no fim**.

**Tech Stack:** Astro (componentes `.astro`), CSS vivo em `public/styles.css`. Sem framework de testes — verificação é `npm run build` (compila) + inspeção visual em `npm run dev` + medição de contraste WCAG.

---

## Global Constraints

- **O branco manda.** `--paper` fica a **97.4% de luminância** — praticamente branco. O castanho entra em `--paper-alt`, `--paper-warm`, `--line`, títulos e secções escuras. **Nenhuma task pode trocar a superfície de base por castanho.** Se uma secção grande ficar acastanhada, é sinal de que se foi longe demais.
- **CSS vivo é `public/styles.css`.** Os ficheiros CSS na raiz do repo são mockup legado — não tocar.
- **Nunca hardcodar cor de marca.** Tudo passa por token. Se uma regra precisa de um tom novo, cria-se um token — não se escreve o hex na regra.
- **A hero e a cortina de transição partilham `--hero-img-filter` e `--hero-veil`.** A cortina mostra a mesma foto por cima da hero real: qualquer divergência abre costura visível. Alterar **só os tokens**, nunca duplicar valores. Confirmar com `grep -n "hero-veil\|hero-img-filter" public/styles.css` que existem **apenas** a definição e os consumos por `var()`.
- **Luminância preservada nos neutros de texto.** Exceto onde §3 indica o contrário (o `--ink-faint`, que sobe de propósito para cumprir AA).
- **Pretos e brancos de véu (`rgba(0,0,0,…)`, `rgba(255,255,255,…)`) ficam neutros.** Leem-se como sombra e luz, não como matiz; aquecê-los sujaria os scrims sobre fotografia sem ganho percetível. **Decisão explícita, não omissão.**
- **Plano estritamente cromático.** Nenhuma alteração de layout, timing, geometria, markup estrutural ou dos sistemas de reveal/cortina.
- **Uma task = um commit**, com caminhos explícitos (`git add <ficheiros>`), nunca `git add -A`. **Proibido git destrutivo** (`reset --hard`, `checkout --`, `push --force`).
- **Working tree tem WIP extenso não-commitado** (~30 ficheiros de sessões anteriores). Resolver (commit ou stash) **antes** de começar, para não o arrastar.

---

## §1 — Origem da cor (porquê `#b46511`)

Não é escolha estética arbitrária: é a cor **medida** no logótipo mestre.

| Ficheiro | Cor dominante amostrada |
|---|---|
| `referencias/imagens/LOGO AMS SANTOS HD.png` (fonte) | `#b36818` |
| `public/images/logo-ams-santos-h-light.png` | `#b46511` |
| `public/favicon.svg` (já atualizado) | `#b46511` |

O laranja `#ea5a17` que o CSS usava **nunca correspondeu ao logótipo** — divergia ~12° de matiz e ~11pp de luminosidade. Este plano resolve essa incoerência.

| | Matiz | Saturação | Luminosidade |
|---|---|---|---|
| Antigo `#ea5a17` | 19° | 83% | 50% |
| Novo `#b46511` | 31° | 83% | **39%** |

Mesma saturação, **+12° para o âmbar** e **−11pp de luminosidade** — é essa combinação que lê "pigmento de terra" em vez de "laranja de sinalização".

**A família de castanhos deriva daí:** todos os tons novos ficam entre **24° e 40°** de matiz. É a coerência de matiz que faz o conjunto ler como um sistema, e não como cores avulsas.

---

## §2 — Paleta especificada (valores verbatim)

### Superfícies — o branco domina, o castanho escalona

| Token | Antigo | **Novo** | Luminância | Papel |
|---|---|---|---|---|
| `--paper` | `#ffffff` | **`#fdfcfa`** | **97.4%** | **Base do site.** Branco com um sopro de quente. |
| `--paper-alt` | `#f5f4f2` | **`#f2ece3`** | 84.4% | Areia clara — secção alternada. **É aqui que o castanho entra primeiro.** |
| `--paper-warm` | *(não existia)* | **`#e9dfd1`** | 74.7% | **Novo.** Areia média, para uso **pontual** (cartões de factos, citações, faixas). |
| `--line` | `#e8e7e4` | **`#e3d9cb`** | 84.0% | Divisores — agora visivelmente terrosos. |
| `--dark` | `#141414e5` | **`#241a12e5`** | 1.2% | Secções escuras em **café**, já não preto neutro. **Manter o alpha `e5`.** |
| `--dark-soft` | `#0a0a0a` | **`#150f0a`** | 0.6% | Café profundo. |

### Tinta e castanhos

| Token | Antigo | **Novo** | Papel |
|---|---|---|---|
| `--ink` | `#121212` | **`#1a1410`** | Texto principal — quase-preto acastanhado. |
| ~~`--ink-title`~~ | — | ~~`#3b2a1c`~~ | ❌ **REVERTIDO E REMOVIDO.** Decisão do utilizador: os títulos que eram pretos ou brancos mantêm-se pretos e brancos. O `.title-split` volta a herdar do contexto e o token deixou de existir. |
| `--ink-soft` | `#565654` | **`#5d5346`** | Texto secundário — taupe. |
| `--ink-faint` | `#9a9997` | **`#72685a`** | Rótulos discretos. **Escurece de propósito** — ver §3. |
| `--brown` | *(não existia)* | **`#6b4a2f`** | **Novo.** Castanho médio — ícones, molduras, superfícies pequenas. |

### Acentos

| Token | Antigo | **Novo** | Papel |
|---|---|---|---|
| `--accent` | `#ea5a17` | **`#b46511`** | Cor da marca. Superfícies, dots, bordas, traços. |
| `--accent-text` | *(não existia)* | **`#9f590f`** | **Novo.** Acento quando é **texto** sobre claro — ver §3. |
| `--accent-deep` | `#c1470c` | **`#8d4f0c`** | Sombra do ocre — hover/sweep. |
| `--accent-dk` | `#ff7d38` | **`#d79142`** | Bronze claro, para fundos escuros. |

### Texto sobre escuro (hoje cinza-azulado hardcoded)

| Onde | Antigo | **Novo** |
|---|---|---|
| Footer — corpo/ícones | `#cdd0d4` | **`#f2ece3`** |
| Footer — parágrafos e links | `#a7abb1` | **`#b8ab9a`** |
| Footer — rodapé legal | `#7e828a` | **`#a89d8f`** |

> ⚠️ O rodapé legal indicava `#93877a` até à revisão da Task 4. Dá **3.62:1**
> sobre o fundo escuro real — falha AA. Ver o aviso de medição em §3.

---

## §3 — Contraste WCAG (medido, não estimado)

Todos os pares calculados sobre a paleta nova. Alvo: **AA texto normal = 4.5:1**.

| Par | Ratio | Veredito |
|---|---|---|
| `--ink` / `--paper` | 17.79:1 | ✅ |
| `--ink-soft` / `--paper` | 7.34:1 | ✅ |
| `--ink-faint` / `--paper` | 5.33:1 | ✅ *(era 2.85:1 — falhava)* |
| `--brown` / `--paper` | 7.74:1 | ✅ |
| `--accent-text` / `--paper` | 5.24:1 | ✅ |
| `--ink` / `--paper-alt` | 15.53:1 | ✅ |
| `--ink-soft` / `--paper-alt` | 6.41:1 | ✅ |
| `--accent-text` / `--paper-alt` | 4.57:1 | ✅ |
| `--ink` / `--paper-warm` | 13.84:1 | ✅ |
| `--ink-soft` / `--paper-warm` | 5.71:1 | ✅ |
| `--accent-text` / `--paper-warm` | 4.08:1 | ⚠️ **falha** — usar `--accent-deep` |
| `--accent-deep` / `--paper-warm` | 4.90:1 | ✅ |
| `#f2ece3` / `--dark` | 10.82:1 | ✅ |
| Footer corpo `#b8ab9a` / `--dark` | 5.65:1 | ✅ |
| Footer legal `#a89d8f` / `--dark` | 4.77:1 | ✅ |
| `--accent-dk` / `--dark` | 4.85:1 | ✅ *(pouca folga)* |
| `#fff` / `--brown` (superfície) | 7.94:1 | ✅ |
| `#fff` / `--accent` (faixa) | 4.37:1 | ✅ *(alvo 3:1, texto grande)* |
| **`--accent` / `--paper`** | **4.26:1** | ⚠️ **falha AA — por desenho** |

> ⚠️ **CORRIGIDO EM EXECUÇÃO (revisão da Task 3).** A primeira versão desta
> tabela mediu a coluna "sobre `--dark`" contra `#241a12` **opaco**, ignorando
> o alpha `e5`. Mas o `--dark` **nunca** renderiza opaco: compõe sempre sobre
> `--paper`, e o fundo real medido no browser é **`rgb(58,49,42)`** —
> luminância 3.26%, não 1.2%. Todos os valores "sobre escuro" estavam ~26%
> otimistas. Os da tabela acima já são os **reais, amostrados em píxeis**.
>
> Consequência que isto evitou: a Task 6 ia aplicar `#93877a` ao rodapé legal
> na fé de uns falsos 4.86:1 — o valor real é **3.62:1**, falha AA. Os valores
> da Task 6 foram corrigidos em conformidade.
>
> **Regra para o resto do plano:** qualquer cor sobre `--dark` mede-se contra
> `rgb(58,49,42)`, nunca contra o hex do token.

**Três conclusões acionáveis:**

1. **`--accent` não serve para texto pequeno sobre claro** (4.26:1). Por isso existe **`--accent-text` (`#9f590f`)**, que passa sobre **as duas** superfícies claras (5.24:1 no branco, 4.57:1 na areia). A Task 2 troca os usos *de texto*. O `--accent` continua a servir superfícies, bordas e dots, onde não há mínimo a cumprir.
2. **`--ink-faint` deixa de falhar.** Era 2.85:1 (reprovado); passa a 5.33:1. **Consequência visual assumida:** as legendas discretas (meta das seams, rótulos) ficam **notoriamente mais presentes**. É uma mudança de hierarquia deliberada — se ficar pesado, o recuo é subir o token para `~#8a8175` e aceitar de novo a falha de AA. Decisão do utilizador na verificação da Task 3.
3. **Sobre `--paper-warm` há três tons de acento e só dois servem.** A tabela
   original validou só `--ink` e `--ink-soft` nessa superfície; em execução
   (Task 4) descobriu-se que o `--accent-text` cai para **4.08:1** ali. Regra
   final, por superfície:

   | Superfície | Acento como texto |
   |---|---|
   | `--paper` · `--paper-alt` | `--accent-text` (5.24 · 4.57) |
   | `--paper-warm` | **`--accent-deep`** (4.90) |
   | `--dark` | `--accent-dk` (4.85) |

   Isto dá finalmente uso ao `--accent-deep`, que estava definido sem consumidor.

---

## Estrutura de ficheiros

- **Modificar:** `public/styles.css` — tokens + aplicação + resíduos (Tasks 1–7)
- **Modificar:** `src/pages/historico.astro`, `src/components/Seam.astro` — desmontar o andaime de teste (Task 1)
- **Modificar:** `src/components/Footer.astro` — `style` inline com cor fria (Task 6)
- **Modificar:** `src/components/Testimonials.astro` — defaults de cor off-brand (Task 7)
- **Modificar:** `src/layouts/Base.astro`, `public/site.webmanifest`, `public/favicon.svg` — chrome (Task 8)
- **Modificar:** `design/ui-styleguide.md`, `design/tokens-studio.json` — fonte de verdade do Figma (Task 9)

---

### Task 1 ✅ CONCLUÍDA: Tokens de acento + remover o andaime de teste

O núcleo. Vira quase todo o site de uma vez, porque tudo consome `var(--accent)`.

**Files:**
- Modify: `public/styles.css`
- Modify: `src/pages/historico.astro`
- Modify: `src/components/Seam.astro`

- [x] **Step 1: Trocar os tokens de acento** em `:root` (~linhas 29–31):

```css
  --accent:     #b46511;   /* ocre queimado — cor real do logótipo AM Santos */
  --accent-text:#9f590f;   /* acento como TEXTO sobre claro (AA em branco e areia) */
  --accent-deep:#8d4f0c;   /* sombra do ocre (hover / sweep) */
  --accent-dk:  #d79142;   /* bronze claro — sobre fundos escuros */
```

- [x] **Step 2: Remover o bloco de teste** `body.palette-test-b46511{…}` (logo a seguir ao fecho do `:root`). Passa a ser o comportamento global.

- [x] **Step 3: Remover o `palette` de teste** em `src/pages/historico.astro` — retirar `palette="test-b46511"` do `<Base>`, manter tudo o resto.

- [x] **Step 4: Consolidar o teste da seam.** O ocre em "AM Santos" e no "©" foi validado e mantém-se — mas **para todas as seams**. Remover `.seam--test-orange{…}` e passar a cor às regras base:

```css
.seam__brand{ white-space:nowrap; justify-self:center; font-weight:600; color:var(--accent-text); }
.seam__index{ white-space:nowrap; font-variant-numeric:tabular-nums; justify-self:end; color:var(--ink); }
.seam__copy{ color:var(--accent-text); }
```

Em `src/pages/historico.astro`, retirar `seam--test-orange` da classe da `<Seam>` (fica só `seam--top`).

> `.seam__copy` (o `<span>` à volta do `©`) **mantém-se** no `Seam.astro` — é o que permite colorir o símbolo sem colorir o ano.

- [x] **Step 5: Variante escura da seam.** Confirmar que `.seam--dark .seam__brand` continua a `var(--paper)` — **não** deve herdar `--accent-text`, que não tem contraste sobre escuro.

- [x] **Step 6: Build.** `npm run build` — sem erros.

- [x] **Step 7: Verificação visual.** `npm run dev`. Percorrer `/`, `/portfolio`, `/historico`, `/sobre-nos`, `/equipa`, `/contactos` e um `/empreendimentos/<slug>`:
  - Todo o laranja vivo desapareceu; o acento lê-se ocre/terra.
  - O acento **bate com o ícone do logótipo no header** — pôr os dois no mesmo enquadramento é o teste decisivo.
  - Seams: "AM Santos" e "©" a ocre em **todas** as páginas; o ano a tinta.

- [x] **Step 8: Commit**

```bash
git add public/styles.css src/pages/historico.astro src/components/Seam.astro
git commit -m "feat(cor): acento passa a ocre queimado #b46511 (cor real do logotipo)"
```

---

### Task 2 ✅ CONCLUÍDA: Acento como texto → `--accent-text`

Corrige o buraco de acessibilidade de §3: `--accent` a 4.26:1 não serve texto pequeno.

**Files:**
- Modify: `public/styles.css`

- [x] **Step 1: Localizar os usos de acento como cor de texto:**

```bash
grep -n "color:var(--accent)" public/styles.css
```

- [x] **Step 2: Trocar para `var(--accent-text)`** apenas onde o acento é **texto sobre fundo claro**. Casos esperados: `.btn:hover`, `.scrolled .nav__list a:hover`, `.scrolled .nav__list a[aria-current="page"]`, `.lang-switch__option.is-active`, `.member__role`, `.muted a:hover`, o rótulo de acento (~linha 844) e o link de acento (~linha 684).

- [x] **Step 3: NÃO trocar** onde o acento é superfície, borda ou traço — mantêm `var(--accent)`: `.seam__label::before`, `.btn::before` (sweep), `.divider__tab`, `.scroller::-webkit-scrollbar-thumb`, `.field …:focus{ border-color }`, `.dslider__arrow:hover{ background }`, `.wm--line{ stroke }`, `.wm--fill{ fill }`.

> Regra prática: **se pinta glifos → `--accent-text`; se pinta pixels de fundo/traço → `--accent`.**

- [x] **Step 4: Build.** `npm run build` — sem erros.

- [x] **Step 5: Verificação.** Medir no devtools o contraste de `.member__role` e `.btn:hover` sobre `--paper` — esperado **≥ 4.5:1**. Confirmar que o dot da seam e o sweep dos botões **não** escureceram.

- [x] **Step 6: Commit**

```bash
git add public/styles.css
git commit -m "fix(a11y): acento como texto usa --accent-text (AA em branco e areia)"
```

---

### Task 3 ✅ CONCLUÍDA: Superfícies e tinta — a família de castanhos

O passo que faz o site ler castanho **sem deixar de ser branco**.

**Files:**
- Modify: `public/styles.css`

- [x] **Step 1: Substituir os neutros** em `:root` (~linhas 23–33) e **acrescentar os três tokens novos**:

```css
  --paper:      #fdfcfa;   /* base do site — branco com um sopro de quente */
  --paper-alt:  #f2ece3;   /* areia clara — secção alternada */
  --paper-warm: #e9dfd1;   /* areia média — uso pontual (factos, citações) */
  --ink:        #1a1410;   /* texto principal — quase-preto acastanhado */
  --ink-soft:   #5d5346;   /* texto secundário — taupe */
  --ink-faint:  #72685a;   /* rótulos discretos (agora AA — ver §3) */
  --brown:      #6b4a2f;   /* castanho médio — ícones, molduras */
  --line:       #e3d9cb;   /* divisores terrosos */
  --dark:       #241a12e5; /* secções escuras em café — MANTER o alpha e5 */
  --dark-soft:  #150f0a;
```

- [x] **Step 2: Verificar o alpha do `--dark`.** `#241a12e5` — oito dígitos. Se o `e5` se perder, a hero deixa de se ver por trás das secções escuras e a cortina abre costura.

- [x] **Step 3: Caçar brancos hardcoded que deviam ser `--paper`:**

```bash
grep -n "#ffffff\|#fff\b" public/styles.css
```

Manter `#fff` onde é **texto sobre escuro ou sobre o acento** (aí branco puro é correto). Trocar para `var(--paper)` onde é **superfície de página** — em especial a cortina de transição (~linha 1513), que tem de coincidir exatamente com o fundo do body, senão pisca no swap.

- [x] **Step 4: Build.** `npm run build` — sem erros.

- [x] **Step 5: Verificação visual — e uma decisão.**
  - **Teste da dominância:** ao rolar qualquer página, a impressão geral tem de continuar **branca**, com o castanho a aparecer em faixas e detalhes. Se alguma vista der "página castanha", parar e aliviar `--paper-alt` para `#f5f0e8`.
  - As secções escuras leem **café**, não preto.
  - Nas transições entre páginas, **a cortina não pisca**.
  - **Decisão sobre `--ink-faint`:** as legendas discretas ficaram mais presentes (5.33:1, contra 2.85:1 antes). Confirmar com o utilizador se o ganho de legibilidade compensa o ruído visual. Se não: subir para `~#8a8175` e registar que volta a falhar AA.

- [x] **Step 6: Commit**

```bash
git add public/styles.css
git commit -m "feat(cor): familia de castanhos nas superficies, tinta e linhas"
```

---

### Task 4 ✅ CONCLUÍDA: Aplicar o castanho onde ele se vê

Os tokens de Task 3 só rendem se forem **usados**. Esta task coloca `--paper-warm` em serviço. (O `--ink-title` foi aplicado e depois **revertido** a pedido do utilizador — ver §2; o `--brown` ficou em reserva — ver Task 10.)

**Files:**
- Modify: `public/styles.css`

- [x] ~~**Step 1: Títulos a castanho-escuro.**~~ ❌ **REVERTIDO.** Foi aplicado ao `.title-split` e desfeito a pedido do utilizador: títulos ficam a preto e branco. Nota factual para quem reler: o `.title-split` **não é Fraunces** — é `"Kompot Display", var(--serif)`, onde o serif é só fallback.

```bash
grep -n "\.display\|\.hero__title\|\.block-head\|font-family:var(--serif)" public/styles.css
```

Aplicar a `.display`, `.display-sm`, títulos de `.block-head` e `.card__title`. **Não aplicar** a títulos **sobre fundo escuro** (esses continuam `--paper`) nem sobre o acento.

- [x] **Step 2: `--paper-warm` em uso pontual.** Escolher **no máximo dois** destes, para não saturar:
  - cartões de `.facts` / `.fact` (hoje brancos sobre branco — ganham corpo)
  - o bloco de citação/testemunhos
  - a faixa de contadores

  Regra: **nunca duas superfícies `--paper-warm` adjacentes**, e nunca numa secção que já seja `--paper-alt`.

- [x] **Step 3: `--brown` em detalhes.** Molduras de imagem, ícones dos `socials`, `.divider__tab` alternativo, bordas de `.facts`. Detalhe, não área.

- [x] **Step 4: Build.** `npm run build` — sem erros.

- [x] **Step 5: Verificação visual.**
  - Os títulos leem **castanho-escuro**, não preto — comparar com o corpo de texto ao lado, a diferença tem de ser percetível mas não gritante.
  - Reaplicar o **teste da dominância** (Step 5 da Task 3): a página continua a ler branca.
  - Contraste dos títulos sobre a superfície em que assentam ≥ 4.5:1 (§3 cobre branco, areia e areia média).

- [x] **Step 6: Commit**

```bash
git add public/styles.css
git commit -m "feat(cor): titulos a castanho-escuro e superficies quentes pontuais"
```

---

### Task 5 ✅ CONCLUÍDA: Hero — de azul-aço para bronze

A maior inversão do plano. O tratamento atual é **explicitamente frio** ("mais clara e mais fria (azulada)… wash azul-aço") — é o que resta a contradizer o registo terroso.

**Files:**
- Modify: `public/styles.css`

- [x] **Step 1: Substituir o filtro e o véu** em `:root` (~linhas 53–62), **comentário incluído**:

```css
  /* Tratamento da foto da hero: quente e terrosa (bronze/sépia).
     Duas camadas: (1) filtro na própria imagem — levanta ligeiramente as
     luzes e puxa a temperatura para o âmbar sem lavar a cor; (2) véu por
     cima — a gradação escura de legibilidade, mais um wash de bronze.
     A cortina de transição usa exatamente estes tokens: mostra a mesma foto
     por cima da hero real e qualquer diferença de cor abriria costura. */
  --hero-img-filter: brightness(1.06) contrast(.94) saturate(.92) sepia(.12);
  --hero-veil:
    linear-gradient(180deg, rgba(12,9,6,.38) 0%, rgba(12,9,6,.08) 45%, rgba(12,9,6,.58) 100%),
    linear-gradient(180deg, rgba(150,110,62,.26) 0%, rgba(176,138,88,.16) 50%, rgba(96,68,38,.34) 100%);
```

**Notas de intenção:** `saturate` sobe de `.78` → `.92` (o antigo tirava saturação quente de propósito — agora queremos guardá-la); `sepia(.12)` dá o pouso terroso; o preto do véu passa de neutro a `rgba(12,9,6)`, quente.

- [x] **Step 2: Confirmar que não há cópias.**

```bash
grep -n "hero-veil\|hero-img-filter" public/styles.css
```

Esperado: **uma** definição de cada + consumos por `var()`. Se aparecer um gradiente duplicado à mão, é bug pré-existente — corrigir para `var()` e registar no commit.

- [x] **Step 3: Build.** `npm run build` — sem erros.

- [x] **Step 4: Verificação visual — a mais importante do plano.**
  - `/` — a hero lê **bronze/dourado**, não azul.
  - **Navegar da home para `/sobre-nos` pela navbar** e observar a cortina: ao assentar sobre a hero real **não pode haver costura** (linha ou salto de cor). Se houver, os tokens divergiram — voltar ao Step 2.
  - Repetir em `/equipa`, `/contactos` e num `/empreendimentos/<slug>`.
  - O título branco da hero continua legível (o véu escureceu ligeiramente, portanto melhora).

- [x] **Step 5: Commit**

```bash
git add public/styles.css
git commit -m "feat(cor): hero passa de wash azul-aco a bronze terroso"
```

---

### Task 6 ✅ CONCLUÍDA: Footer — cinzentos azulados → cinzentos-terra

**Files:**
- Modify: `public/styles.css`
- Modify: `src/components/Footer.astro`

- [x] **Step 1: Trocar os cinzentos frios** no bloco `FOOTER` (~linhas 1215–1232):

> Valores **medidos contra o fundo real** `rgb(58,49,42)` (ver aviso em §3),
> não contra o hex do token.

| Ocorrência | De | Para | Contraste real |
|---|---|---|---|
| `.site-footer{ color: }` | `#cdd0d4` | `#f2ece3` | 10.82:1 |
| `.footer-col p, .footer-col a{ color: }` | `#a7abb1` | `#b8ab9a` | 5.65:1 |
| `.socials a{ color: }` | `#cdd0d4` | `#f2ece3` | 10.82:1 |
| `.footer-bottom{ color: }` | `#7e828a` *(3.30:1, falhava)* | **`#a89d8f`** | **4.77:1** |

> O `#93877a` que esta tabela indicava antes dá **3.62:1** — continuaria a
> falhar AA. O `#a89d8f` é o tom mais discreto que ainda cumpre. Custo
> assumido: a hierarquia entre o corpo do rodapé (5.65:1) e o texto legal
> (4.77:1) fica mais comprimida do que no original — é o preço de cumprir AA.

- [x] **Step 2: Corrigir o `style` inline** em `src/components/Footer.astro:44` — tem `color:#a7abb1` escrito à mão no atributo. Substituir por classe:

```astro
<label class="check check--footer" style="margin-top:1rem">
```

e acrescentar ao bloco FOOTER do CSS:

```css
.check--footer{ color:#b8ab9a; }
```

> Porquê classe e não trocar o hex inline: o inline ganha à cascata e fica invisível a qualquer futura mudança de paleta.

- [x] **Step 3: Build.** `npm run build` — sem erros.

- [x] **Step 4: Verificação.** Os textos secundários do rodapé leem **cinza-quente**. O consentimento da newsletter tem a **mesma cor** dos restantes parágrafos (antes destacava-se por ser inline). Hover dos links a bronze.

- [x] **Step 5: Commit**

```bash
git add public/styles.css src/components/Footer.astro
git commit -m "feat(cor): footer troca cinzentos azulados por cinzentos-terra"
```

---

### Task 7 ✅ CONCLUÍDA: Testemunhos + superfícies escuras residuais

Recolhe os últimos pontos frios, incluindo **um ciano manifestamente off-brand**.

**Files:**
- Modify: `public/styles.css`
- Modify: `src/components/Testimonials.astro`

- [x] **Step 1: Testemunhos — defaults off-brand.** O componente traz cores de biblioteca (cinzas Tailwind e um **ciano `#00a6fb`**, que não pertence a lado nenhum nesta marca). Em `src/components/Testimonials.astro:39–44`:

```js
  name: colors.name ?? '#3b2a1c',
  designation: colors.designation ?? '#72685a',
  testimony: colors.testimony ?? '#5d5346',
  arrowBg: colors.arrowBackground ?? '#241a12',
  arrowFg: colors.arrowForeground ?? '#f2ece3',
  arrowHoverBg: colors.arrowHoverBackground ?? '#b46511',
```

- [x] **Step 2: Alinhar os fallbacks do CSS** (~linhas 1694–1710) com os mesmos valores — hoje repetem `#000`, `#6b7280`, `#4b5563`, `#141414`, `#f1f1f7`, `#00a6fb`. Os dois lados têm de concordar, senão o default muda consoante o `colors` vir ou não preenchido.

- [x] **Step 3: Gradiente dos painéis** (~linhas 970–975). O escurecimento tem viés azul (`rgba(15,17,20,…)` — azul é o canal mais alto):

```css
  background:linear-gradient(to top,
    rgba(20,15,10,.82) 0%,
    rgba(20,15,10,.35) 45%,
    rgba(138,111,78,.10) 100%);
```

> O terceiro stop (`rgba(138,111,78,.10)`) **já é bronze** e mantém-se — era o único sinal terroso que o site já tinha.

- [x] **Step 4: Varrer o que sobrou.**

```bash
grep -nE "rgba\([0-9]+, ?[0-9]+, ?[0-9]+" public/styles.css
```

Aquecer **apenas** os que tenham B > R **e não sejam** `rgba(0,0,0,…)` nem `rgba(255,255,255,…)` (esses ficam neutros por decisão — ver Global Constraints).

- [x] **Step 5: Build.** `npm run build` — sem erros.

- [x] **Step 6: Verificação.** A seta dos testemunhos em hover fica **ocre**, não ciano. Painéis do track record leem castanho-quente. Nenhum resíduo azul no site.

- [x] **Step 7: Commit**

```bash
git add public/styles.css src/components/Testimonials.astro
git commit -m "feat(cor): testemunhos e superficies escuras alinhados com a paleta terrosa"
```

---

### Task 8 ✅ CONCLUÍDA: Chrome do browser (favicon, theme-color, manifest)

A cor da marca também aparece **fora** da página: barra do browser, PWA, separador.

**Files:**
- Modify: `src/layouts/Base.astro`
- Modify: `public/site.webmanifest`
- Modify: `public/favicon.svg`

- [x] **Step 1: `src/layouts/Base.astro:26`** — `<meta name="theme-color" content="#141414">` → `content="#241a12"`.

- [x] **Step 2: `public/site.webmanifest`** — `theme_color` e `background_color`: `#141414` → `#241a12`.

- [x] **Step 3: `public/favicon.svg`** — os três `fill="#b46511"` **já estão corretos** (não tocar). Trocar os dois `fill="#141414"` (encaixe) para `#241a12`, e o `fill="#ffffff"` do fundo para `#fdfcfa`, para casar com `--paper`.

- [x] **Step 4: Build.** `npm run build` — sem erros.

- [x] **Step 5: Verificação.** Hard-reload (Ctrl+Shift+R) e confirmar o favicon no separador. Em Android/Chrome, a barra de endereço assume o novo `theme-color`.

- [x] **Step 6: Commit**

```bash
git add src/layouts/Base.astro public/site.webmanifest public/favicon.svg
git commit -m "feat(cor): favicon, theme-color e manifest alinhados com a paleta terrosa"
```

---

### Task 9 ✅ CONCLUÍDA: Sincronizar a documentação do design system

Sem esta task o Figma e o site divergem — e o styleguide passa a mentir.

**Files:**
- Modify: `design/ui-styleguide.md`
- Modify: `design/tokens-studio.json`

- [x] **Step 1: `design/tokens-studio.json`** — atualizar `global.color` com §2, incluindo as entradas novas:

```json
      "paper":          { "value": "#fdfcfa", "type": "color", "description": "Base do site (branco quente)" },
      "paper-alt":      { "value": "#f2ece3", "type": "color", "description": "Areia clara — secção alternada" },
      "paper-warm":     { "value": "#e9dfd1", "type": "color", "description": "Areia média — uso pontual" },
      "ink":            { "value": "#1a1410", "type": "color", "description": "Texto principal" },
      "ink-soft":       { "value": "#5d5346", "type": "color", "description": "Texto secundário (taupe)" },
      "ink-faint":      { "value": "#72685a", "type": "color", "description": "Rótulos discretos" },
      "brown":          { "value": "#6b4a2f", "type": "color", "description": "Castanho médio — detalhes" },
      "line":           { "value": "#e3d9cb", "type": "color", "description": "Divisores terrosos" },
      "accent":         { "value": "#b46511", "type": "color", "description": "Ocre queimado (cor real do logotipo)" },
      "accent-text":    { "value": "#9f590f", "type": "color", "description": "Acento como texto sobre claro (AA)" },
      "accent-deep":    { "value": "#8d4f0c", "type": "color", "description": "Sombra do ocre (hover)" },
      "accent-on-dark": { "value": "#d79142", "type": "color", "description": "Bronze claro, sobre fundos escuros" },
      "dark":           { "value": "#241a12", "type": "color", "description": "Secções escuras (café)" },
      "dark-soft":      { "value": "#150f0a", "type": "color", "description": "Café profundo" },
      "on-dark":        { "value": "#f2ece3", "type": "color", "description": "Texto sobre fundos escuros" },
      "on-dark-soft":   { "value": "#b8ab9a", "type": "color", "description": "Texto secundário sobre escuro" },
```

- [x] **Step 2: `design/ui-styleguide.md`** — atualizar a §1 e o texto à volta:
  - Título: `## 1. Paleta — preto · branco · laranja` → **`## 1. Paleta — branco · terra · ocre`**
  - Substituir todos os hex; acrescentar `paper-warm`, `brown`, `accent-text`. **Não** exportar `ink-title` — foi removido.
  - `**Sobre escuro/laranja:** texto a #ffffff, secundário a #cdd0d4` → `#f2ece3` / `#b8ab9a`.
  - Reescrever a "Regra da marca": deixou de ser *"alto contraste branco ↔ preto com laranja como acento"*. Passa a ser: **base branca dominante, com uma família terrosa (24°–40° de matiz) a entrar por superfícies secundárias, títulos e blocos escuros.** O contraste vem da **luminosidade**, não do choque de matiz.
  - Anotar o limite de §3: **`accent` não serve texto pequeno sobre claro — para isso existe `accent-text`.**
  - Registar a regra de dominância: **`paper-warm` no máximo em dois *tipos de bloco* por página, nunca adjacentes.** (Não "duas superfícies": a home tem três cartões `.pilar`, que são **um** tipo de bloco.)
  - Documentar a regra de acento por superfície da §3 (`paper`/`paper-alt` → `accent-text`; `paper-warm` → `accent-deep`; `dark` → `accent-dk`) — é a parte da paleta mais fácil de aplicar mal.

- [x] **Step 3: Corrigir a referência à faixa laranja.** A §4 documenta a `.section--accent` ("faixa de acento a toda a largura") — mas essa faixa **já não existe**: `grep -rn "section--accent" src/` não devolve nada, e o comentário em `src/pages/index.astro:125` regista a decisão ("o laranja vive nos números, em toda a página, em vez de saturar uma só secção"). Marcar como **legada** ou remover.

- [x] **Step 4: Verificação.** Confrontar hex a hex a §1 do styleguide com o `:root` de `public/styles.css`. Têm de coincidir exatamente.

- [x] **Step 5: Commit**

```bash
git add design/ui-styleguide.md design/tokens-studio.json
git commit -m "docs(design): styleguide e tokens do Figma na paleta terrosa"
```

---

### Task 10 (opcional): Limpeza de CSS morto

Independente da recoloração — fazer **só depois** de tudo verificado, para não misturar sinais.

**Files:**
- Modify: `public/styles.css`

> ⚠️ **CORRIGIDO EM EXECUÇÃO (revisão da Task 2).** A versão original deste
> plano dizia que `.stat*` era CSS morto. **É falso.** `src/components/Stats.astro`
> emite `.stat`, `.stat__num` e `.stat__label`, e `src/pages/sobre-nos.astro:69`
> renderiza esse componente dentro de uma `.section--dark`. **Remover `.stat*`
> parte o quadro de valores de `/sobre-nos`.** Só `.section--accent*` é morto.

- [ ] **Step 1: Confirmar, separadamente, o que está morto.**

```bash
grep -rn "section--accent" src/     # esperado: NADA  → morto, pode sair
grep -rn "stat__num\|<Stats" src/   # esperado: Stats.astro + sobre-nos.astro → VIVO, não tocar
```

- [ ] **Step 2: Remover apenas** `.section--accent*` (~120–125) e
  `html.reveal-ready body.is-home .section--accent::after` (~1486).
  **Preservar todo o bloco `.stat*`** — está em produção em `/sobre-nos`.

- [ ] **Step 3: Tokens sem consumidor.** `--accent-deep` **já não é órfão** — a Task 4 deu-lhe uso no `.pilar__n` (acento sobre `--paper-warm`). Falta decidir sobre o **`--brown` (`#6b4a2f`)**, que ficou definido e sem pintar um único píxel: a dose conservadora escolhida pelo utilizador não executou o "castanho em detalhes". Opções: **manter em reserva** (documentado no Figma como vocabulário) ou **aplicar** a ícones dos `socials`, molduras e bordas de `.facts`. **Decisão do utilizador — não remover sem perguntar.**

- [ ] **Step 4: CSS morto do `.display` — e DUAS regras hoje partidas.** `class="display"` tem **zero** ocorrências no site construído: os títulos de secção passaram a `.title-split` (`BlockHead` → `TitleSplit`) num refactor anterior a este plano. As regras `.display` / `.display--sm` são inalcançáveis — **mas duas delas deviam estar a fazer alguma coisa e não fazem.** Ambas são **pré-existentes** e **não-cromáticas**, por isso ficam fora do âmbito deste plano e exigem confirmação do utilizador:

  1. **Tamanho do h1 (medido).** `.section--flat-top .block-head .display{ font-size:clamp(2.5rem,6vw,4.6rem) }` (~1437) existe, diz o comentário, "para dar mais destaque ao título de abertura" de `/portfolio` e `/historico`. Nunca aplica. **Medido a 1440px: o h1 sai a 64px em vez dos 73.6px desenhados — 13% mais pequeno.** Corrigir = trocar `.display` por `.title-split` no seletor.
  2. **Animação de entrada.** `html.reveal-ready .section--flat-top .block-head :is(.display, .lead)` (~1422/1429) — como o `<h1>` é `.title-split`, **só o `.lead` anima; o título entra sem movimento.** Corrigir = `:is(.title-split, .lead)`.

  Ambas nascem do mesmo refactor e resolvem-se com a mesma troca de seletor.

- [ ] **Step 5: Build + verificação.** `npm run build`; confirmar que os contadores da home continuam intactos.

- [ ] **Step 6: Commit**

```bash
git add public/styles.css
git commit -m "chore(css): remover regras da faixa de acento legada"
```

---

## §4 — Ordem, risco e reversibilidade

| Task | Alcance | Risco | Como reverter |
|---|---|---|---|
| 1 — Acentos | Global | Baixo | 4 linhas no `:root` |
| 2 — `accent-text` | Texto de acento | Baixo | trocar token de volta |
| 3 — Superfícies/tinta | Global | **Médio** — toca tudo | 11 linhas no `:root` |
| 4 — Aplicar castanho | Títulos + superfícies | **Médio** — é onde se exagera | por regra |
| 5 — Hero | Heros + cortina | **Alto** — costura visível se divergir | 2 tokens |
| 6 — Footer | Local | Baixo | 4 valores + 1 classe |
| 7 — Testemunhos/escuros | Local | Baixo | por ficheiro |
| 8 — Chrome | Fora da página | Baixo | 3 ficheiros |
| 9 — Docs | Nenhum runtime | Nenhum | — |
| 10 — Limpeza | CSS morto | Baixo | `git revert` |

**Ponto de paragem natural:** depois da **Task 5**. Tasks 1–5 entregam a recoloração percetível na íntegra; 6–10 são acabamento e coerência. Se quiser avaliar antes de continuar, é aqui.

**A task mais provável de precisar de afinação é a 4** — é onde o castanho se pode tornar excessivo. O `teste da dominância` (Task 3, Step 5) é o travão, e deve correr outra vez no fim da Task 4.

---

## §5 — Registado, não resolvido (dívida assumida)

- **Scrims neutros mantidos.** `rgba(0,0,0,…)` e `rgba(255,255,255,…)` ficam como estão (ver Global Constraints).
- **Imagens de conteúdo não são tratadas.** As fotografias (`public/images/`) mantêm a temperatura original. A hero é a única exceção: leva `--hero-img-filter` (`sepia(.12)` incluído), que aquece a própria foto, **mais** o véu bronze por cima.
- **A hero de `/sobre-nos` continua a ler fria — e o CSS não resolve.** O véu e o filtro estão aplicados (valores computados idênticos aos da home); a fotografia é que tem céu azul forte, que um wash a 26% de opacidade não domina. Saídas possíveis, todas fora de CSS: (a) trocar a foto por uma de céu neutro, (b) fazer grading do ficheiro, (c) subir o `sepia()` — **não recomendado**, lava as fotos que já estão boas.
- **`--ink-faint` muda de carácter.** Passa a cumprir AA (5.33:1), mas as legendas ficam mais presentes. Decisão explícita na Task 3, Step 5 — com recuo documentado.
- **Tensão com o briefing, resolvida a favor deste plano.** `CONTEXTO.md` fixa o público como *"nobre, mas não luxoso (sóbrio, refinado, sem ostentação)"*; o pedido falou em *"toque de luxo"*. Não há conflito real: uma paleta de pigmento de terra é precisamente **sóbria e refinada** — o luxo vem da contenção cromática, não de brilho. Nenhum tom é metálico, e nenhum é mais saturado do que a marca já usava.

---

## Self-review (cobertura)

- **Branco continua dominante** → constraint global + `--paper` a 97.4% + teste da dominância nas Tasks 3 e 4. ✓
- **"Mais tons marrom"** → família nova (`--paper-alt`, `--paper-warm`, `--brown`, `--dark` café) em Task 3; `--paper-warm` posto em serviço em Task 4. O `--ink-title` foi revertido a pedido do utilizador (títulos a preto e branco) e o `--brown` ficou em reserva. ✓
- **Acento novo em todo o lado** → Task 1 (tokens) + Task 2 (texto). ✓
- **Origem verificável da cor** → §1, amostrada do logótipo mestre. ✓
- **Coerência de matiz (24°–40°)** → §1, garante que lê como sistema. ✓
- **Resíduos hardcoded frios** → Tasks 6 e 7 (footer, testemunhos, painéis). ✓
- **Ciano off-brand `#00a6fb`** → Task 7, Step 1. ✓
- **Contraste medido, não estimado** → §3; único "falha" é `--accent` como texto, resolvido por `--accent-text`. ✓
- **Costura hero/cortina preservada** → constraint global + Task 5 Steps 2 e 4. ✓
- **Cor fora da página** → Task 8. ✓
- **Figma/styleguide sincronizados** → Task 9. ✓
- **Dívida e decisões explícitas** → §5. ✓
