# AMS Santos — Guia de Estilo (UI)

Referência para trabalhar a UI/UX no Figma. Os valores vêm de
`public/styles.css` (tokens em `:root`). Tamanhos tipográficos são o
**máximo** de cada `clamp()` (desktop); indico o intervalo responsivo.

> Import rápido no Figma: instala o plugin **Tokens Studio**, cria um set
> e importa `design/tokens-studio.json`. Ficas com cores, tipografia,
> espaçamentos e text styles prontos.

---

## 1. Paleta — preto · branco · laranja

| Token | Hex | Uso |
|---|---|---|
| `paper` | `#ffffff` | Fundo principal (branco) |
| `paper-alt` | `#f5f4f2` | Fundo de secção alternada |
| `ink` | `#121212` | Texto principal (quase preto) |
| `ink-soft` | `#565654` | Texto secundário |
| `ink-faint` | `#9a9997` | Labels discretos |
| `line` | `#e8e7e4` | Linhas / divisores |
| **`accent`** | **`#ea5a17`** | **Laranja vibrante (marca)** — eyebrows, botões, links |
| `accent-deep` | `#c1470c` | Laranja profundo (hover / sweep) |
| `accent-on-dark` | `#ff7d38` | Laranja sobre fundos escuros (mais brilhante) |
| `dark` | `#141414` | Secções escuras / hero |
| `dark-soft` | `#0a0a0a` | Preto mais profundo |

**Sobre escuro/laranja:** texto a `#ffffff`, secundário a `#cdd0d4`.

Regra da marca: alto contraste **branco ↔ preto**, com o **laranja** só
como acento (nunca lavado). A faixa de contadores é a exceção — laranja
a toda a largura, texto branco, palavra de destaque a preto.

---

## 2. Tipografia

Duas famílias (Google Fonts) — **instala ambas no Figma**:
- **Fraunces** (serif) — títulos. Pesos 300 e 400.
- **Inter** (sans) — texto, labels, botões. Pesos 400/500/600/700.

| Estilo | Fonte | Peso | Tamanho (px) | Entrelinha | Tracking | Notas |
|---|---|---|---|---|---|---|
| Hero (páginas internas) | Fraunces | 300 | 88 (resp. 42–88) | 105% | — | |
| Display (h2 de secção) | Fraunces | 400 | 66 (resp. 34–66) | 110% | — | |
| Display SM | Fraunces | 400 | 45 (resp. 27–45) | 110% | — | |
| Nº contador | Fraunces | 400 | 59 | 100% | — | tabular-nums |
| Título de card | Fraunces | 400 | 24 | 110% | — | |
| Lead | Inter | 400 | 26 (resp. 18–26) | 140% | — | |
| Corpo | Inter | 400 | 16 | 160% | — | |
| Eyebrow | Inter | 600 | 12 | 100% | 0.32em | MAIÚSCULAS + traço 34×1px antes |
| CTA / meta | Inter | 600 | 11 | 120% | 0.22em | MAIÚSCULAS |

---

## 3. Layout & espaçamento

- **Container:** largura máx. `1280px`, margem lateral `gutter` (20 → 72px).
- **Padding vertical de secção:** 72 → 150px (usa `section` = 120 como base no Figma).
- **Escala de espaçamento:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- **Raios:** `md` = 12px (cards/factos), `pill` = 999px (chips, círculos).
- **Grelhas:** cards de projeto em 3 colunas (2 em tablet, 1 em telemóvel);
  contadores em 5 colunas (2 / 1); factos e galeria em 3 colunas.

---

## 4. Componentes

**Botão (`.btn`)** — texto Inter, com seta `→`; underline/sweep a `accent`
no hover. Variante sobre escuro: borda branca translúcida, texto branco.

**Eyebrow** — traço horizontal (34×1px, `accent`) + label MAIÚSCULAS 12px,
tracking 0.32em, cor `accent` (branco em secções escuras/laranja).

**Card de projeto** — média com `aspect-ratio` 3/4 (4/5 nas grelhas);
overlay com gradiente escuro em baixo; título (Fraunces 24), meta e CTA
(`accent-on-dark`). Todo o card é clicável (link para o empreendimento).

**Hero** — imagem full-bleed + overlay escuro (gradiente top/bottom);
conteúdo alinhado em baixo. Alturas: **home 94vh**, **internas 80vh**.
Título a branco; eyebrow a `accent-on-dark`; indicador "Scroll" em baixo.

**Faixa de acento (`.section--accent`)** — fundo `accent` a toda a largura;
eyebrow + título + números a branco; palavra de destaque do título a
preto (`#141414`); divisores verticais a `rgba(255,255,255,.28)`.

**Ficha de factos (`.facts`)** — grelha de cartões brancos, borda `line`,
raio 12px: valor em Fraunces (~32px) + rótulo MAIÚSCULAS 12px `ink-soft`.

**Formulário de contacto** — campos com underline (sem caixa), labels
MAIÚSCULAS pequenas; botão "Enviar mensagem" com underline.

**Header / Nav** — logo à esquerda (versão clara sobre hero, escura quando
scrolled), nav horizontal Inter; em ≤1024px vira menu hambúrguer.

---

## 5. Páginas a reconstruir no Figma

1. **Home** (`/`) — hero, Quem Somos, **faixa laranja de contadores**,
   Portfólio (scroller de cards), Track record (secção escura com painéis),
   Equipa, Contacto.
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
