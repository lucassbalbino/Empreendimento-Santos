# Marca-d'água do símbolo — identidade site-wide

**Data:** 2026-07-28
**Estado:** Aprovado (design) — pronto para plano de implementação
**Mockup validado:** `artifact/bb503a8b-7c77-4bdd-816a-548304e7f6b5` (v3-sistema-aplicado)

## Objetivo

Dar identidade ao site levando o **símbolo da marca** (os três blocos empilhados
com o encaixe preto, do logótipo dos empreendimentos Santos) para além do
cabeçalho. O símbolo passa a viver como **marca-d'água** em todas as secções,
com um sistema de variação que evita a sensação de carimbo repetido.

O problema diagnosticado não é a cor (o `styles.css` vivo já usa laranja
vibrante `#ea5a17` como cor de identidade) nem o movimento (já existe a costura
diagonal como assinatura entre secções). O que falta é **repetição do símbolo**
ao longo das páginas. Esta é a peça que o utilizador validou primeiro e com mais
entusiasmo (a marca-d'água na secção escura).

## Decisões fechadas

- **Ativo:** o símbolo do logótipo redesenhado em SVG (geometria abaixo). Não se
  usa o PNG do logótipo — o SVG permite contorno, cor por token e escala nítida.
- **Duas afinações**, ambas em uso (pedido explícito do utilizador):
  - **Contorno (`line`)** — `fill:none; stroke:var(--accent)`, opacidade ~0.5.
    Recomendado para fundos **claros**: mantém o laranja limpo, sem "pêssego".
  - **Preenchido (`fill`)** — `fill:var(--accent)`, opacidade ~0.07. Usado em
    fundos de **painel** (`--paper-alt`) e onde se quer mais calor.
  - **Escuro (`dark`)** — `fill` a off-white (`--on-dark`/`#f2efe9`), opacidade
    ~0.08. Nas secções escuras o símbolo é **off-white, não laranja** — o brilho
    vem do contraste com o fundo, e evita colidir com o laranja da costura.
- **Sistema de variação** (a regra que impede a monotonia): **nunca o mesmo
  carimbo duas vezes seguidas**. Varia-se por secção:
  - **Afinação:** contorno nas claras, preenchido nas de painel/escuras.
  - **Lado:** sangra por `esquerda`/`direita`, alternando.
  - **Escala:** `lg` (~46% / máx 440px) nas heros e portfólio; `md` (~34% / máx
    320px) no corpo; `sm` (~24% / máx 210px) em secções curtas (contacto).
  - **Cor:** laranja nas claras, off-white nas escuras.
- **Intensidade:** a do mockup v3 (contorno .5 / preenchido .07 / escuro .08).
  Validada como "presente mas de fundo".
- **Uma marca-d'água por secção.** Nunca duas na mesma secção; nunca por cima de
  texto denso ou de imagem — sempre do lado do respiro.

## Geometria do símbolo (SVG)

`viewBox="0 0 100 92"`, `aria-hidden="true"`:

```
<rect class="bar" x="20" y="14" width="62" height="18"/>
<rect class="bar" x="20" y="37" width="62" height="18"/>
<rect class="bar" x="20" y="60" width="62" height="18"/>
<rect class="tab" x="4"  y="30" width="20" height="16"/>
```

Três barras (as "lajes") + o encaixe (`tab`) que sai à esquerda. As classes
`.bar` e `.tab` recebem `fill`/`stroke` conforme a afinação.

## Abordagem técnica

### Componente `src/components/Watermark.astro`

Encapsula o SVG e as classes de variação. API:

```
<Watermark variant="line|fill|dark" side="l|r" size="sm|md|lg" />
```

O componente rende uma **camada auto-clipada** própria, para não obrigar a secção
a ter `overflow` (ver risco abaixo):

```
<div class="wm-layer" aria-hidden="true">
  <svg class="wm wm--{variant} wm--{side} wm--{size}" viewBox="0 0 100 92"> … </svg>
</div>
```

`.wm-layer{position:absolute; inset:0; overflow:clip; pointer-events:none;
z-index:0}`. A secção-hospedeira só precisa de `position:relative` e de garantir
que o **conteúdo** fica acima (`position:relative; z-index:1` no wrapper de
conteúdo, tipicamente já é o `.container`).

### CSS (em `public/styles.css`, o CSS vivo)

- Tokens/afinações: `.wm--line/.wm--fill/.wm--dark` (fill/stroke + opacidade),
  `.wm--l/.wm--r` (posição + `translateY(-50%)`, `top:50%`), `.wm--sm/md/lg`
  (largura via `min(%, px)`).
- `.wm-layer` (camada auto-clipada, acima).
- Reutiliza os tokens existentes `--accent`, `--accent-dk`/`--on-dark`.

### Coexistência com sistemas existentes (riscos a respeitar)

1. **Costura diagonal (`.stitch`) e cortina de revelação (`.home-reveal`)** —
   as cunhas/fios da costura **sangram** entre secções. Por isso **NÃO** se põe
   `overflow` na `<section>`; o clip vive só no `.wm-layer`. Assim a costura
   continua a transbordar livremente.
2. **Sistema de reveal** (`reveal-*`, `is-visible`, delays inline) — a
   marca-d'água é **decorativa e estática**: **não** leva classes `reveal-*`.
   Renderiza logo, sem entrar na cascata de reveal (evita saltos pré-paint e o
   problema do `transition-delay` inline). Fica sob o conteúdo, que revela normal.
3. **`overflow:clip` (não `hidden`)** na camada — coerente com a nota do projeto
   de que `hidden` pode criar scroll container indesejado.
4. **Secções escuras com componente** (ex.: Portfólio/DoubleSlider) — a
   marca-d'água entra atrás do componente (`z-index:0` na camada, conteúdo do
   slider acima). Verificar que o fundo do slider não é opaco a tapar a camada.

### Acessibilidade e performance

- `aria-hidden="true"`; puramente decorativa; sem texto alternativo.
- Estática — sem animação, logo sem questão de `prefers-reduced-motion`.
- SVG inline leve (4 rects); sem pedidos de rede, sem imagens.

## Mapa de colocação

Regra geral: **uma por secção**, alternando afinação/lado/escala para nunca
repetir seguido. O `Hero` (componente partilhado) ganha uma opção de
marca-d'água **escura** — assim todas as páginas abrem com a marca atrás do
título.

### `index.astro`

| Secção | Fundo | variant | side | size |
|---|---|---|---|---|
| Hero | escuro | dark | r | lg |
| Quem Somos | branco | line | l | md |
| O Que Fazemos | branco | fill | r | md |
| Portfólio (DoubleSlider) | escuro | dark | l | lg |
| Track Record | branco | fill | r | md |
| Equipa (`--alt`) | painel | line | l | md |
| Contacto | branco | line | r | sm |

### Outras páginas

- **Hero de cada página** (`portfolio`, `sobre-nos`, `equipa`, `contactos`,
  `historico`, `empreendimentos/[slug]`) → `dark r lg`.
- **`sobre-nos`** → aplicar a mesma alternância às suas secções (Quem Somos, 3
  verticais, Serviços, Equipa, Contacto).
- **`portfolio`** → grelha + Track Record + Contacto (alternando).
- **`empreendimentos/[slug]`** → Hero + uma no corpo.
- **`equipa` / `contactos` / `historico`** → Hero + a secção-declaração principal.

O executor aplica a regra de alternância; a tabela do `index` é o padrão de
referência.

## Fora de âmbito (2ª vaga — documentado, não perdido)

Estes elementos do kit foram desenhados e mostrados no mockup, mas ficam para
depois:

- **Divisor-assinatura de 3 linhas** — dentro do conteúdo (nunca nas fronteiras
  entre secções, que já são da costura).
- **Moldura de imagem com encaixe** — só nas imagens editoriais grandes.
- **Numerais editoriais** — só onde há sequência real (ex.: verticais/serviços
  do `sobre-nos`), não como numeração global de secções.

## Critérios de sucesso

- O símbolo aparece, variado, em todas as secções principais de todas as páginas.
- Nenhuma secção mostra duas marcas-d'água iguais seguidas.
- A costura diagonal e a cortina de revelação continuam a funcionar (nada é
  clipado indevidamente).
- A marca-d'água nunca prejudica a legibilidade do texto.
- Claro e escuro: contorno nas claras, off-white nas escuras; sem "pêssego".
