# Páginas institucionais — Design

Data: 2026-07-08

## Contexto

Site definitivo da Empresa Bela, construído em Astro, dirigido por JSON em
`src/data/` e editável via Sveltia CMS (`public/admin/config.yml`). O visual
segue o mockup já aprovado (baseado no site da Habitat Invest). As páginas
`index`, `sobre-nos` e `portfolio` já existem seguindo este padrão.

Objetivo: criar 4 novas páginas replicando a **estrutura** das páginas
equivalentes do Habitat Invest (seções e ordem), mantendo conteúdo placeholder
(lorem ipsum) e imagens placeholder, tudo editável no CMS. Atualizar também a
navegação (Header + Footer) com os nomes reais.

Componentes reutilizáveis existentes: `Hero` (padrão inline), `BlockHead`,
`CardScroller`, `Team`, `ContactForm`, `Stats`.

## Navegação

Header (`src/components/Header.astro`) e rótulos correspondentes — substituir
`Menu 01–06` por links reais:

| Rótulo        | URL            |
|---------------|----------------|
| Sobre Nós     | `/sobre-nos`   |
| Portfólio     | `/portfolio`   |
| Histórico     | `/historico`   |
| SF Properties | `/sf-properties` |
| Equipa        | `/equipa`      |
| Contactos     | `/contactos`   |

`EN` e busca mantêm-se. Footer mantém estrutura; nada obrigatório além de
continuar coerente.

## Páginas

### 1. Histórico — `/historico` (base: Track Record)
Ordem das seções:
1. Hero interno
2. Intro (`BlockHead`)
3. Faixa de números (`Stats`) — anos, projetos concluídos, unidades
4. Grelha de projetos concluídos (card do Portfólio: nome, localização,
   tipologia, CTA) — ~12 itens
5. Formulário de contacto (`ContactForm`)

Dados: `src/data/historico.json` — `hero`, `intro`, `stats`, `projetos[]`,
`contacto`.

### 2. SF Properties — `/sf-properties` (base: Five Stars Services)
1. Hero interno (título "SF Properties")
2. Sobre a marca (bloco split imagem + texto)
3. Serviços (blocos imagem + texto, como Sobre Nós → `servicos`)
4. Grelha de projetos em destaque (2–3 cards)
5. Formulário de contacto

Dados: `src/data/sf-properties.json` — `hero`, `sobre`, `servicos`,
`projetos[]`, `contacto`.

### 3. Equipa — `/equipa` (base: Equipa)
1. Hero interno
2. Direção / Board (destaque 2 colunas — `Team` com membros principais)
3. Equipa geral (grelha `Team`)
4. Empresas do grupo (subtítulos, cada um com a sua grelha `Team`)
5. Formulário de contacto

Dados: `src/data/equipa.json` — `hero`, `direcao{eyebrow,title,members[]}`,
`equipa{eyebrow,title,members[]}`, `grupo[]{title, members[]}`, `contacto`.

### 4. Contactos — `/contactos` (base: Contactos)
1. Hero interno
2. Formulário de contacto + dados diretos (email/telefone) — `ContactForm`
3. "Onde Estamos": morada + placeholder de mapa
4. (rodapé já traz contactos)

Dados: `src/data/contactos.json` — `hero`, `contacto`, `onde{title, morada, mapaLabel}`.

## CMS

Adicionar 4 coleções em `public/admin/config.yml` (uma por JSON novo), seguindo
o padrão das coleções `home`/`portfolio`/`sobre` existentes. Regenerar/duplicar
em `dist/admin/config.yml` conforme necessário (o `dist/` é gerado por build).

## Fora de escopo

- Mapa real embutido (usa-se placeholder).
- Conteúdo real de texto/imagens (fica placeholder para o cliente preencher).
- Refatoração não relacionada.
