# Quadro de confiança — secção "O Que Fazemos" (Sobre Nós)

## Contexto

A secção `.comotrabalhamos` em `sobre-nos.astro` (grid `1.2fr 1fr`: cascata de imagens à esquerda, `split__body` à direita) tem hoje um título + um parágrafo denso com 3 números embutidos em `**negrito**` (17 projetos, 185.000 m², 95 milhões). O objetivo é dar mais peso à confiança na mensagem e trocar o parágrafo por um quadro de valores factuais, reaproveitando os 5 contadores já usados na home.

## Mudanças

**1. Título** (`sobre.json` → `oQueFazemos.title`)
De `"Do conceito\nà entrega da chave"` para `"20 anos de\nconfiança, obra a obra"` (mantém a quebra de linha em duas linhas, ajustada ao novo texto).

**2. Corpo: parágrafo → quadro de valores**
- `sobre-nos.astro` importa `home.json` e passa `home.oQueFazemos.stats` (17 projetos, 128 unidades residenciais, 42 unidades não residenciais, 185.000 m² de construção, 95 milhões investidos) ao componente `<Stats>` existente (`src/components/Stats.astro`), com a mesma contagem animada da home.
- Remove-se o uso de `sobre.oQueFazemos.paragrafo` nesta secção (o campo pode ficar não utilizado ou ser removido de `sobre.json` — decisão de limpeza no plano).
- `.stats` por defeito é uma grelha de 5 colunas pensada para largura total (`.seam`); aqui vive dentro de `split__body`, uma coluna estreita (~1fr de `1.2fr 1fr`). É necessária uma variante compacta: grelha 2 colunas (últim item a ocupar a linha sozinho ou centrado), números mais pequenos que os da home.

**3. Balanço da grelha de imagens vs. quadro de números**
Pedido explícito do utilizador: se a largura do quadro de números (2 colunas) ficar apertada, ajustar o `grid-template-columns` de `.split.comotrabalhamos` (hoje `1.2fr 1fr`) para dar mais espaço ao corpo (números) e menos à cascata de imagens — ex. `1fr 1fr` ou `0.9fr 1fr`. A cascata de imagens deve continuar a preencher a coluna sem distorcer o `aspect-ratio:3/4` das fotos.

## Fora de âmbito
- Não mexe nos contadores da home nem no componente `<Stats>` em si (só numa variante de estilo aplicada via classe adicional).
- Não altera as restantes secções da página Sobre Nós.
