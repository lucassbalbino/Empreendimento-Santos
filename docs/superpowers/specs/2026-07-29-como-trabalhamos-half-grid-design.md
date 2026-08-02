# Como Trabalhamos — half-grid parallax + parágrafo de contadores

## Contexto

Na página `sobre-nos.astro`, a secção "O QUE FAZEMOS — VERTICAIS" (`sobre.oQueFazemos`) mostra hoje 3 cartões (Qualidade, Conforto, Sustentabilidade) em `.verticals`. Não há nenhuma imagem nem dado numérico nesta secção — os contadores (17 projetos, 128 unidades residenciais, 42 unidades não residenciais, 185.000 m² de construção, 95 milhões investidos) só existem hoje em `home.json` / `<Stats>`, na página inicial.

Referência visual: [truekindskincare.com/philosophy](https://truekindskincare.com/philosophy) — grid de imagens em parallax a ocupar metade do ecrã, texto corrido (não tiles) na outra metade, com números embutidos na prosa.

## Objetivo

Substituir a grelha de 3 cartões por um layout a duas metades:

- **Metade esquerda** — grid de imagens em parallax (masonry, 2 colunas desfasadas), com fotos reais de empreendimentos, cada coluna a deslocar-se a uma velocidade diferente ao scroll.
- **Metade direita** — título atual, seguido de um único parágrafo corrido que funde o texto das 3 verticais (Qualidade/Conforto/Sustentabilidade) com os contadores, embutidos como frases completas (não tiles, sem animação de contagem).

## Conteúdo

### Imagens (metade esquerda)

5 fotos de `empreendimentos.json`, reaproveitando ficheiros já existentes em `/images/empreendimentos/` (independente da flag `imagemReal` — a instrução do utilizador foi puxar as imagens mesmo que não retratem o projeto real):

- Coluna A (3 fotos, mais lenta): `valflores-terraces.webp`, `valflores-terraces-aerea.webp`, `interior-1.webp`
- Coluna B (2 fotos, mais rápida): `clt-tojal.webp`, `interior-2.webp`

Layout masonry: coluna B começa desfasada verticalmente (ex.: metade da altura de uma foto) para o efeito de grelha irregular. Ao fazer scroll, a coluna A desloca-se mais devagar (fator menor) e a coluna B mais depressa (fator maior), tal como o parallax `--qs-parallax` já existente em `quemsomos__media`.

### Parágrafo (metade direita)

Um único parágrafo corrido, substituindo `verticais`, algo como:

> "A excelência em cada um dos **17 projetos** executados é o que nos distingue — do primeiro traço ao último acabamento, com uma equipa de alto nível em arquitetura, engenharia, decoração e gestão imobiliária. Projetamos para quem lá vai viver: arquitetura moderna e funcional, com foco no bem-estar e no máximo conforto climático, já concretizada em **185.000 m² de construção**. E fazemo-lo com uma abordagem eco-friendly e materiais sustentáveis, que reduzem os custos de manutenção ao longo da vida do edifício — sustentada por **95 milhões investidos** ao longo do nosso percurso."

(Texto final afinado na implementação; os 3 números-frase destacados a laranja, sem contador animado.)

## Estrutura de dados

`src/data/sobre.json` → `oQueFazemos`:
- Remove `verticais`.
- Adiciona `paragrafo` (string, com os 3 números embutidos marcados para destaque, ex. via `**...**` a converter em `<strong class="accent">` no template, ou HTML inline direto).
- Adiciona `imagens`: lista de 5 caminhos (ou 2 arrays `colunaA`/`colunaB`), apontando para os ficheiros indicados acima.

## Componentes / CSS

- Novo bloco `.comotrabalhamos` (grid 2 colunas, como `.split`): `.comotrabalhamos__grid` (metade esquerda, masonry 2 colunas) + `.comotrabalhamos__body` (metade direita, título/parágrafo).
- `.comotrabalhamos__grid`: `overflow:clip` (não `hidden`, mesma razão documentada em `quemsomos__media` — não criar scroll container que prenda o `view()`/parallax).
- Imagens com `object-fit:cover`, `scale(1.2–1.3)` (folga para o deslocamento do parallax, análogo ao `scale(1.45)` do `qsImg` mas ajustado à amplitude menor de cada foto individual).
- Números no parágrafo: `<strong class="accent">` ou span com a cor laranja já usada nos números do site.

## Comportamento (parallax)

Generalizar o padrão já existente em `Base.astro` (`moverQuem`, `--qs-parallax`, calculado pela distância ao centro do ecrã, clampado à folga do scale) para duas colunas independentes:

- Novo mover, ex. `moverComoTrabalhamos()`, corre no mesmo evento `lenis.on('scroll', …)` e no boot inicial, a par de `moverHero`/`moverQuem`.
- Seleciona `.comotrabalhamos__col--a` e `.comotrabalhamos__col--b` (ou os `img` dentro delas); aplica um fator diferente a cada uma (ex. `CT_FACTOR_A = 0.10`, `CT_FACTOR_B = 0.20`), escrevendo `--ct-parallax-a` / `--ct-parallax-b`.
- Guard idêntico ao existente: se os elementos não existirem na página (não é o caso aqui, mas mantém o padrão), a função não faz nada — sem custo nas outras páginas.
- Sem JS ou com `prefers-reduced-motion`, as variáveis ficam a 0 e as imagens ficam estáticas (mesmo comportamento documentado para `--qs-parallax`).

## Fora de âmbito

- Não mexe nos contadores animados da homepage (`Stats.astro` / `home.oQueFazemos.stats`) — ficam como estão.
- Não adiciona imagens novas ao repositório; reutiliza ficheiros já existentes em `/images/empreendimentos/`.
- Não altera as outras secções de `sobre-nos.astro` (Serviços, Equipa, Contacto).
