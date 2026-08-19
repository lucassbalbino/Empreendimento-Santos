# AMS Santos — Guia de Estilo (UI)

Referência para trabalhar a UI/UX no Figma. Os valores vêm de
`public/styles.css` (tokens em `:root`). Tamanhos tipográficos são o
**máximo** de cada `clamp()` (desktop); indico o intervalo responsivo.

> Import rápido no Figma: instala o plugin **Tokens Studio**, cria um set
> e importa `design/tokens-studio.json`. Ficas com cores, tipografia,
> espaçamentos e text styles prontos.

---

## 1. Paleta — branco · terra · ocre

O acento é a cor **medida** no logótipo mestre
(`referencias/imagens/LOGO AMS SANTOS HD.png` → `#b36818`). O laranja
`#ea5a17` que o site usava até 2026-08 **nunca correspondeu à marca**:
divergia ~12° de matiz e ~11pp de luminosidade.

Toda a família fica entre **24° e 40°** de matiz — é essa disciplina que a
faz ler como sistema e não como cores avulsas.

### Superfícies — o branco domina, o castanho escalona

| Token | Hex | Luminância | Uso |
|---|---|---|---|
| `paper` | `#fdfcfa` | **97.4%** | **Base do site.** Nunca fica castanha. |
| `paper-alt` | `#f2ece3` | 84.4% | Areia clara — secção alternada. É aqui que o castanho entra primeiro. |
| `paper-warm` | `#e9dfd1` | 74.7% | Areia média — uso **pontual**. |
| `line` | `#e3d9cb` | 84.0% | Linhas / divisores |
| `dark` | `#241a12` | — | Secções escuras em café. Leva alpha `e5` no CSS. |
| `dark-soft` | `#150f0a` | — | Café profundo |

### Tinta

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#1a1410` | Texto principal **e títulos** — quase-preto acastanhado |
| `ink-soft` | `#5d5346` | Texto secundário (taupe) |
| `ink-faint` | `#72685a` | Rótulos discretos |
| `brown` | `#6b4a2f` | Castanho médio — **em reserva**, ainda sem uso em produção |

### Acentos — um por superfície

| Token | Hex | Onde |
|---|---|---|
| **`accent`** | **`#b46511`** | **Superfícies, dots, bordas, traços.** Não serve texto pequeno. |
| `accent-text` | `#9f590f` | Acento como **texto** sobre `paper` / `paper-alt` |
| `accent-deep` | `#8d4f0c` | Acento como **texto** sobre `paper-warm` (e hover / sweep) |
| `accent-dk` | `#d79142` | Acento como **texto** sobre `dark` |

### Texto sobre escuro

Um papel, não uma superfície — por isso tem tokens próprios. Os rácios são
contra o fundo **composto** `rgb(58,49,42)`, não contra `#241a12`.

| Token | Hex | Rácio | Uso |
|---|---|---|---|
| `on-dark` | `#f2ece3` | 10.82:1 | Corpo. Coincide hoje com `paper-alt` — no CSS é um alias dele. |
| `on-dark-soft` | `#b8ab9a` | 5.65:1 | Secundário |
| `on-dark-dim` | `#a89d8f` | 4.77:1 | Legal / meta — no **limiar** de AA |

---

### As três regras que é fácil quebrar

**1. O branco manda.** O castanho entra por camadas secundárias — secção
alternada, linhas, superfícies pontuais e blocos escuros. **Nunca** pela
superfície de leitura. `paper-warm` no máximo em **dois tipos de bloco** por
página, nunca adjacentes, e nunca dentro de uma secção que já seja
`paper-alt`.

**2. Os títulos são a preto e branco.** O castanho vive nas superfícies e nos
acentos, não na tipografia de título. Títulos herdam do contexto: `ink` sobre
claro, branco sobre a hero e sobre secções escuras.

**3. O acento muda com a superfície.** Se pinta **glifos**, escolhe pela
superfície de baixo; se pinta **fundo ou traço**, é sempre `accent`:

| Superfície | Acento como texto | Rácio |
|---|---|---|
| `paper` | `accent-text` | 5.24:1 |
| `paper-alt` | `accent-text` | 4.57:1 |
| `paper-warm` | `accent-deep` | 4.90:1 |
| `dark` | `accent-on-dark` | 4.85:1 |

> ⚠️ **Medir contra o fundo real, não contra o hex do token.** O `dark` tem
> alpha `e5` e nunca renderiza opaco: compõe sobre o `paper` e o fundo
> efetivo é **`rgb(58,49,42)`**. Medir contra `#241a12` dá valores ~26%
> otimistas.

---

## 2. Tipografia

Três famílias — **instala as três no Figma**:
- **Kompot Display** — títulos de hero e de secção (`.title-split`).
  Peso 700, sempre em **MAIÚSCULAS**. Não é do Google Fonts.
- **Fraunces** (serif) — todo o resto do serif: cards, nomes, factos,
  contadores. Pesos 300/400/500.
- **Inter** (sans) — texto, labels, botões. Pesos 400/500/600/700.

> ⚠️ **Estado real hoje:** o ficheiro da Kompot Display **não está no
> repositório**, por isso todos os títulos renderizam na Fraunces (o
> fallback). E a versão *demo* que existe em `referencias/fontes/` **não
> serve**: não tem acentos — desenha `Á` como `A` e `Ç` como `C`. Enquanto
> isto não estiver decidido, desenha os títulos em Fraunces e trata a Kompot
> como intenção, não como facto. Ver P13 no registo de bugs.

| Estilo | Fonte | Peso | Tamanho (px) | Entrelinha | Caixa |
|---|---|---|---|---|---|
| Hero (`.title-split--hero`) | Kompot Display | 700 | 90 (resp. 24–90) | 105% | MAIÚSCULAS |
| Título de secção (`.title-split`) | Kompot Display | 700 | 64 (resp. 15–64) | 110% | MAIÚSCULAS |
| Display SM | Fraunces | 400 | 45 (resp. 27–45) | 110% | — | |
| Nº contador | Fraunces | 400 | 59 | 100% | — | tabular-nums |
| Título de card | Fraunces | 400 | 24 | 110% | — | |
| Lead | Inter | 400 | 26 (resp. 18–26) | 140% | — | |
| Corpo | Inter | 400 | 16 | 160% | — | |
| CTA / meta | Inter | 600 | 11 | 120% | 0.22em | MAIÚSCULAS |

---

## 3. Layout & espaçamento

Valores lidos do CSS vivo (`--maxw`, `--gutter`, `--section`).

- **Container:** largura máx. **`1480px`**, margem lateral `gutter`
  **`clamp(18px, 3.4vw, 52px)`** (usa **52** como base no Figma a 1440).
- **Padding vertical de secção:** **`clamp(168px, 18vw, 300px)`**
  (usa **240** como base no Figma a 1440). O site respira muito mais do que a
  versão anterior deste guia dizia.
- **Escala de espaçamento:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- **Raios:** `md` = 12px (factos), **`card` = 6px** (cards de projeto),
  `pill` = 999px (chips, círculos).
- **Grelhas:** cards de projeto em 3 colunas (2 em tablet, 1 em telemóvel);
  factos e galeria em 3 colunas.
- **Contadores:** **não** são uma fila de 5. `/sobre-nos` usa `.stats--compact`
  (2 colunas, secção escura); a home usa `.facts--contadores` (2×2, sobre o
  branco). A `.stats` de 5 colunas existe no CSS mas **nunca renderiza**.

---

## 4. Componentes

**Botão (`.btn`)** — texto Inter, com seta `→`; underline/sweep a `accent`
no hover. Variante sobre escuro: borda branca translúcida, texto branco.

**Card de projeto** — média com `aspect-ratio` 3/4 (4/5 nas grelhas);
overlay com gradiente escuro em baixo; título (Fraunces 24), meta e CTA
(`accent-on-dark`). Todo o card é clicável (link para o empreendimento).

**Hero** — imagem full-bleed + overlay escuro (gradiente top/bottom);
conteúdo alinhado em baixo. Alturas: **home 94vh**, **internas 80vh**.
Título a branco; indicador "Scroll" em baixo.

**~~Faixa de acento (`.section--accent`)~~** — ❌ **LEGADO, já não existe no
site.** A faixa laranja a toda a largura foi retirada do desenho: o acento
passou a viver nos números, ao longo da página, em vez de saturar uma só
secção. As regras **já foram removidas** do CSS. **Não reconstruir no Figma.**

**Ficha de factos (`.facts`)** — grelha de cartões brancos, borda `line`,
raio 12px: valor em Fraunces (~32px) + rótulo MAIÚSCULAS 12px `ink-soft`.

**Formulário de contacto** — campos com underline (sem caixa), labels
MAIÚSCULAS pequenas; botão "Enviar mensagem" com underline.

**Header / Nav** — logo à esquerda (versão clara sobre hero, escura quando
scrolled), nav horizontal Inter; em ≤1024px vira menu hambúrguer.

---

## 5. Páginas a reconstruir no Figma

1. **Home** (`/`) — hero, Quem Somos, contadores (grelha 2×2 sobre o branco,
   **sem faixa de fundo** — ver §4), Portfólio (scroller de cards), Track
   record (secção escura com painéis), Equipa, Contacto.
2. **Portfólio** (`/portfolio`) — hero + 2 grelhas (em desenvolvimento /
   futuros) + contacto.
3. **Histórico** (`/historico`) — hero + grelha de concluídos + contacto.
4. **Empreendimento** (`/empreendimentos/<slug>`) — hero, descrição,
   ficha de factos, galeria, localização, relacionados, contacto.
5. **Sobre Nós**, **SF Properties**, **Equipa**, **Contactos**.

Sugestão de frames: **1440** (desktop) e **390** (telemóvel).

---

## 6. Trazer as páginas para o Figma (plugin html.to.design)

Para teres os ecrãs reais (não só os tokens):

1. Corre o site: `npm run dev` (fica em `http://localhost:4333`).
2. No Figma, instala **html.to.design** e a sua **extensão de browser**.
3. Abre cada página no browser e usa a extensão para capturar → importa
   para o Figma como camadas editáveis. (Sem publicar nada.)
4. Alternativa: publica o site (Cloudflare Pages / Netlify) e dá o **URL**
   ao plugin — importa por URL, sem extensão.

Ressalvas: instala Fraunces e Inter no Figma antes de importar; animações
(reveal, cortinas, hover, count-up) **não** passam — só o estado estático.
