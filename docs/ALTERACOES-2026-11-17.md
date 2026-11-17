# Alterações pedidas — 17/11/2026

Instrução para executar sete alterações no site. Cada item tem o **pedido** (transcrito
como chegou), **onde está hoje** (o código que o pedido afeta) e **o que fazer**. No fim de
cada item, em **Não especificado**, ficam os pontos que o pedido não define. Estes pontos
não devem ser decididos por suposição: confirmar com o cliente antes de os executar.

Regra geral: fazer só o que está pedido. Não reorganizar secções vizinhas, não mudar
textos que o pedido não cita, não acrescentar secções novas.

> O site tem três idiomas. Os textos de [src/data/](../src/data/) são o português; as
> traduções vivem em [public/i18n/pt.json](../public/i18n/pt.json),
> [en.json](../public/i18n/en.json) e [fr.json](../public/i18n/fr.json), endereçadas pelos
> atributos `data-i18n`. O CMS lê [public/admin/config.yml](../public/admin/config.yml).
>
> **Regra de tradução:** tudo o que for alterado ou acrescentado tem de ficar traduzido em
> PT, EN e FR. Cada item traz as traduções prontas numa tabela **Traduções**, escritas no
> estilo das que já existem nos `i18n/*.json`.

---

## 1. Home: trocar a secção "Em números" pela da página Sobre Nós

**Pedido:** "A seção em números na home page deve ser trocada pela seção em números da
página sobre, devem ser idênticas, com o carrossel e fundo marrom."

**Onde está hoje**

- Home, [src/pages/index.astro:82-111](../src/pages/index.astro#L82-L111): secção
  `section section--seam-top` com `<Seam label="Em Números">`. É uma grelha de duas
  colunas (`.contadores`): à esquerda o título `home.oQueFazemos.statsTitle` ("Em números")
  e o parágrafo `home.oQueFazemos.statsLead`; à direita, os contadores `.facts--contadores`
  com os dados de `home.oQueFazemos.stats`. Fundo branco.
- Sobre Nós, [src/pages/sobre-nos.astro:48-72](../src/pages/sobre-nos.astro#L48-L72):
  secção `section section--dark has-blob` com `<Blob />`. À esquerda tem o carrossel de
  imagens `.comotrabalhamos__grid`: duas colunas em movimento, alimentadas por
  `sobre.oQueFazemos.imagens.colunaA` e `colunaB` (cada lista é duplicada no markup para o
  ciclo). À direita, o título `sobre.oQueFazemos.title` ("20 anos de solidez") e
  `<Stats items={home.oQueFazemos.stats} class="stats--compact" .../>`. O fundo é
  `--dark` (`#241a12e5`, castanho escuro), em [public/styles.css:258](../public/styles.css#L258).
- Os números são os mesmos nas duas páginas: ambas leem `home.oQueFazemos.stats`.

**O que fazer**

1. Em [src/pages/index.astro](../src/pages/index.astro), substituir o bloco das linhas
   82-111 (comentário + `<section>`) por uma cópia idêntica do bloco das linhas 48-72 de
   [src/pages/sobre-nos.astro](../src/pages/sobre-nos.astro): mesmas classes
   (`section section--dark has-blob`), `<Blob />`, carrossel `.comotrabalhamos`, título
   e `<Stats ... class="stats--compact">`.
2. Os dados (imagens e título) devem ser os mesmos da Sobre Nós. Para isso, a home tem de
   importar `../data/sobre.json`, ou então os dados têm de ser copiados para
   `home.json`. Ver **Não especificado**.
3. Acrescentar a [index.astro](../src/pages/index.astro) os imports `Stats` e `Blob`
   (`Blob` já está importado; `Stats` ainda não).
4. Remover da home o que deixar de ter uso com a troca, por exemplo os campos
   `statsTitle`/`statsLead` se mais nada os ler.
5. Verificar o CSS que hoje depende de a secção estar no contexto da Sobre Nós:
   - [public/styles.css:1628](../public/styles.css#L1628): `.section:has(.comotrabalhamos__grid){ padding-block:0; }`
     aplica-se a qualquer página.
   - [public/styles.css:2400](../public/styles.css#L2400):
     `html.reveal-ready body.is-home .section--dark::after{ background:var(--dark); }`
     só vale na home. Confirmar que a secção nova fica igual à da Sobre Nós.
   - O resto das regras `.comotrabalhamos` (≈1628-1690, 2828-2846) e `.stats--compact`
     (≈1318) não depende da página.
6. Comparar as duas páginas lado a lado (desktop e telemóvel) para confirmar que ficaram
   idênticas.

**Traduções**

Este item não acrescenta textos novos: os textos da secção já estão traduzidos nos três
idiomas.

| Chave | PT | EN | FR |
|---|---|---|---|
| `sobre.oQueFazemos.title` | 20 anos de solidez | 20 years of solid foundations | 20 ans de solidité |
| `home.oQueFazemos.stats.<i>.label` | (já existe) | (já existe) | (já existe) |

- Se a home reutilizar a secção, deve usar as mesmas chaves `data-i18n` da Sobre Nós
  (`sobre.oQueFazemos.title`, `home.oQueFazemos.stats`). Assim não é preciso criar chaves
  novas.
- Se os dados forem copiados para `home.json`, copiar também as três traduções acima para
  a chave nova da home, em `pt.json`, `en.json` e `fr.json`.

**Não especificado**

- **Seam / rótulo "Em Números".** A secção da home abre com `<Seam label="Em Números">`.
  A da Sobre Nós não tem seam. Como o pedido diz "idênticas", a versão literal fica sem
  seam. Confirmar se o rótulo deve desaparecer.
- **Título e parágrafo.** A Sobre Nós mostra "20 anos de solidez" e não tem parágrafo. A
  home mostra "Em números" e o parágrafo `statsLead`. Pela leitura literal, a home passa a
  ter "20 anos de solidez" e perde o parágrafo.
- **Fonte dos dados.** Partilhar `sobre.json` faz com que as duas secções mudem juntas
  quando forem editadas no CMS. Duplicar em `home.json` faz com que possam divergir.
- **Vizinhança de cor.** A secção seguinte na home é o slider de destaques, também escuro
  (`section--dark`). O item 2 remove esse slider, por isso a vizinha passa a ser
  "O Que Fazemos", que é branca. O pedido não fala de transições entre secções.

---

## 2. Home: retirar "Empreendimentos em destaque"

**Pedido:** "Retirar da home page a seção empreendimentos em destaque, retirar e não
substituir por nenhuma outra seção."

**Onde está hoje**

- [src/pages/index.astro:113-124](../src/pages/index.astro#L113-L124): secção
  `section section--dark section--flush` com `<DoubleSlider projetos={destaques}
  titulo={home.portfolio.title} ...>`. O título é `home.portfolio.title` =
  "Empreendimentos em destaque".
- Dependências na mesma página:
  - [index.astro:4](../src/pages/index.astro#L4): `import DoubleSlider`.
  - [index.astro:13](../src/pages/index.astro#L13): `emDestaque` em `import { porGrupo, emDestaque }`.
  - [index.astro:24](../src/pages/index.astro#L24): `const destaques = emDestaque(8);`.
  - [index.astro:27-36](../src/pages/index.astro#L27-L36): `schemaHome` usa `destaques`
    no `listaDeImoveis(...)` (dados estruturados de SEO: "Empreendimentos em destaque").

**O que fazer**

1. Apagar a `<section>` das linhas 113-124 e o comentário que a acompanha. Não pôr nada
   no lugar dela.
2. Remover o import de `DoubleSlider` e o `emDestaque`/`destaques` se deixarem de ter uso.
3. `schemaHome` usa `destaques`, por isso tem de ser revisto. Ver **Não especificado**.
4. Rever os comentários de [index.astro](../src/pages/index.astro) que descrevem a
   ordem das secções ("PORTFOLIO — abre o capítulo da Obra", "entre o Portfolio e o
   Histórico", etc.), para que continuem certos.
5. Correr `npm run seo`: o [CONTEXTO.md](../CONTEXTO.md) indica que tem de passar.
   [scripts/mobile-check.mjs:49](../scripts/mobile-check.mjs#L49) verifica seletores
   `.dslider__*` e também tem de ser revisto.

**Não especificado**

- **Dados estruturados.** Pode retirar-se a `ItemList` de destaques do `schemaHome`, ou
  mantê-la sem a secção visível. O comentário em
  [index.astro:27-29](../src/pages/index.astro#L27-L29) diz que ela é "a ponte da home
  para as 17 fichas".
- **Restos do componente.** `DoubleSlider.astro`, os campos `home.portfolio` em
  `home.json`, `pt/en/fr.json` e o CMS (`config.yml`, campo `portfolio` da home) ficam sem
  uso na home. O pedido não diz se devem ser apagados.

---

## 3. FAQ: nova pergunta

**Pedido:** acrescentar ao FAQ a pergunta e a resposta seguintes, tal como chegaram:

> **Como é feita a comercialização dos imóveis?**
>
> A comercialização dos nossos imóveis é assegurada pela SF Properties, a imobiliária que
> integra a estrutura da nossa empresa. Com uma equipa comercial especializada, garantimos
> um acompanhamento próximo e personalizado, desde o primeiro contacto até à conclusão do
> processo de compra, proporcionando aos nossos clientes uma experiência simples,
> transparente e segura.

**Onde está hoje**

- O único FAQ do site está na home: [src/pages/index.astro:201-208](../src/pages/index.astro#L201-L208),
  `<Faq items={home.faq.items} i18nBase="home.faq.items" />`.
- Dados em [src/data/home.json](../src/data/home.json), `faq.items`: lista de objetos
  `{ "p": pergunta, "r": resposta }`. Hoje tem 4 itens.
- Traduções em `home.faq.items` de [pt.json](../public/i18n/pt.json#L163), `en.json` e
  `fr.json`, com 4 itens em cada. O componente
  [Faq.astro](../src/components/Faq.astro) endereça cada item pelo índice
  (`home.faq.items.<i>.p` / `.r`).
- No CMS, a lista é editável em `config.yml` (campo `faq` → `items`). A estrutura não
  muda.

**O que fazer**

1. Acrescentar o item `{ "p": "...", "r": "..." }` com o texto acima **no fim** de
   `faq.items` em [src/data/home.json](../src/data/home.json). Passa a ser o 5.º item,
   índice `4`.
2. Acrescentar o item correspondente no fim de `home.faq.items` em `pt.json`, `en.json` e
   `fr.json`, com os textos da tabela abaixo. O índice tem de ser `4` nos quatro ficheiros.

**Traduções** (`home.faq.items.4`)

| | Pergunta (`p`) | Resposta (`r`) |
|---|---|---|
| **PT** | Como é feita a comercialização dos imóveis? | A comercialização dos nossos imóveis é assegurada pela SF Properties, a imobiliária que integra a estrutura da nossa empresa. Com uma equipa comercial especializada, garantimos um acompanhamento próximo e personalizado, desde o primeiro contacto até à conclusão do processo de compra, proporcionando aos nossos clientes uma experiência simples, transparente e segura. |
| **EN** | How are the properties marketed and sold? | The sale of our properties is handled by SF Properties, the real estate agency that is part of our company's structure. With a specialised sales team, we provide close, personalised support from the first contact through to the completion of the purchase, giving our clients a simple, transparent and secure experience. |
| **FR** | Comment se déroule la commercialisation des biens ? | La commercialisation de nos biens est assurée par SF Properties, l'agence immobilière qui fait partie de la structure de notre entreprise. Grâce à une équipe commerciale spécialisée, nous garantissons un accompagnement proche et personnalisé, du premier contact jusqu'à la conclusion de l'achat, offrant à nos clientes et clients une expérience simple, transparente et sécurisée. |

---

## 4. Rodapé: logo da SF Properties como botão

**Pedido:** "Anexar a logo da SF properties no rodapé, a logo deve ser um botão que
redireciona para o site Sf properties (o mesmo link da navbar)."

**Onde está hoje**

- Link da navbar, [src/components/Header.astro:8](../src/components/Header.astro#L8):
  `https://www.sfproperties.pt/`, aberto com `target="_blank" rel="noopener"`
  ([Header.astro:35](../src/components/Header.astro#L35)).
- Rodapé: [src/components/Footer.astro](../src/components/Footer.astro). Colunas em
  `.footer-grid`: marca (logo AM Santos, blurb, redes sociais), Morada, Contactos,
  Newsletter. Por baixo vêm `.footer-links` e `.footer-bottom`.
- Fundo do rodapé: `--dark`, castanho escuro
  ([public/styles.css:1971](../public/styles.css#L1971)).
- **Logo a usar:**
  [referencias/imagens/SF-Properties-logo.png](../referencias/imagens/SF-Properties-logo.png)
  (6601×6601 px, 333 KB). Tem o monograma "Sf" e a palavra "PROPERTIES" em azul-marinho
  sobre fundo **branco**, dentro de uma moldura fina da mesma cor com o canto inferior
  esquerdo arredondado.
- Não existe versão com fundo transparente nem versão clara, e o ficheiro ainda não está
  em `public/images/`.

**O que fazer**

1. Pôr uma versão web de `referencias/imagens/SF-Properties-logo.png` em
   `public/images/`, redimensionada e otimizada. O projeto tem
   `scripts/imagens-otimizar.mjs`.
2. **Posição: logo abaixo da logo da Empreendimentos Santos.** Em
   [Footer.astro](../src/components/Footer.astro), dentro de `.footer-brand`, a logo AM
   Santos é o `<span class="logo footer-logo">…</span>`
   ([Footer.astro:30](../src/components/Footer.astro#L30)). Inserir **logo a seguir** a esse
   `<span>`, antes do `<p data-i18n="site.footer.blurb">`:
   `<a href="https://www.sfproperties.pt/" target="_blank" rel="noopener" aria-label="SF Properties" data-i18n="common.footer.sfProperties" data-i18n-attr="aria-label">`
   com a `<img alt="">` da logo lá dentro. O nome fica no `aria-label` do link, por isso a
   imagem leva `alt` vazio. Usar o mesmo URL e os mesmos atributos da navbar.
3. Estilizar em [public/styles.css](../public/styles.css) junto às regras do rodapé
   (≈1971-1990, ao lado de `.footer-brand .logo` / `.footer-logo img`), com a versão móvel
   no bloco ≈4464.

**Traduções**

A chave nova segue o padrão dos ícones das redes sociais (`common.footer.instagram`,
etc.): é um nome próprio e fica igual nos três idiomas.

| Chave | PT | EN | FR |
|---|---|---|---|
| `common.footer.sfProperties` | SF Properties | SF Properties | SF Properties |

**Não especificado**

- **Tamanho.**
- **Cor e fundo.** A logo é azul sobre branco e o rodapé é castanho escuro. Pode usar-se
  o ficheiro como está, com a caixa branca, ou pedir/gerar uma versão clara ou
  transparente.
- **"Botão".** Pode ser só a imagem com link, ou ter também aspeto de botão (moldura,
  hover) ou texto.

---

## 5. Portfólio: ordem dos "Projetos futuros"

**Pedido:** a ordem em "Projetos futuros" deve ser:
1. Viver
2. Collection Hotel
3. Pinteus Residence
4. Quinta das Amoreiras

**Onde está hoje**

- [src/pages/portfolio.astro:13-16](../src/pages/portfolio.astro#L13-L16): o bloco
  "Futuros" usa `porGrupo('futuro')`.
- [src/utils/projetos.js](../src/utils/projetos.js): `todos` vem ordenado por
  `ano` desc → `destaque` → `nome` (alfabético). `porGrupo` filtra sem reordenar.
- Os quatro projetos do grupo `futuro` em
  [src/content/empreendimentos/](../src/content/empreendimentos/):

  | Ficheiro | `nome` | `ano` | `destaque` |
  |---|---|---|---|
  | `empreendimento-loures-residencial.json` | Viver | 2029 | — |
  | `empreendimento-loures-hotel.json` | Collection Hotel | 2030 | — |
  | `pinteus-residence.json` | Pinteus Residence | 2029 | — |
  | `quinta-das-amoreiras.json` | Quinta das Amoreiras | 2030 | — |

- Ordem que resulta hoje: Collection Hotel → Quinta das Amoreiras → Pinteus Residence →
  Viver.
- O schema ([src/content/config.ts](../src/content/config.ts)) **não tem um campo de
  ordem manual**. Os únicos critérios são `ano`, `destaque` e `nome`. Com eles não se chega
  à ordem pedida sem mudar dados que aparecem no site: Viver (2029) teria de ficar à frente
  de Collection Hotel (2030), e Pinteus (2029) à frente de Quinta das Amoreiras (2030).

**O que fazer**

1. Criar uma forma de impor a ordem pedida ao bloco "Projetos futuros" sem alterar `ano`,
   `nome` nem `destaque` dos projetos.
2. Confirmar em `/portfolio` que a grelha mostra Viver, Collection Hotel, Pinteus
   Residence, Quinta das Amoreiras.

**Não especificado**

- **Mecanismo.** Há duas opções: um campo de ordem por projeto (no schema, no CMS
  `config.yml` e nos JSON), ou uma lista fixa de slugs para este bloco. O pedido só define
  o resultado.
- **Outros sítios.** A home (`emDestaque`) usa o mesmo grupo, mas a secção sai com o
  item 2. A ficha de cada empreendimento e o schema SEO do portfólio (`listaDeImoveis`)
  também usam esta lista. O pedido só fala da página Portfólio.

---

## 6. Equipa: novo setor com quatro colaboradores

**Pedido:** adicionar à página da Equipa um setor com:

| Nome | Função |
|---|---|
| David Teixeira | Direção comercial |
| Cristina Cunha | Agente comercial |
| Anabela Pereira | Agente comercial |
| Catarina Santos | Agente comercial |

**Onde está hoje**

- Página: [src/pages/equipa.astro](../src/pages/equipa.astro). A secção escura
  "EQUIPA GERAL" renderiza `<Team grupos={equipa.equipa.grupos} i18nBase="equipa.equipa.grupos" />`.
- Dados em [src/data/equipa.json](../src/data/equipa.json), `equipa.grupos`: lista de
  `{ "area": "...", "members": [{ "name", "role" }] }`. Hoje tem 3 setores: "Coordenação e
  Gestão", "Arquitetura e Engenharia", "Encarregados de Obra".
- Traduções em `equipa.equipa.grupos` de [pt.json](../public/i18n/pt.json#L204),
  `en.json` e `fr.json`: por grupo, `area` e `members[].role` (os nomes não se traduzem).
  Endereçadas por índice.
- O schema SEO (`listaDePessoas`) junta automaticamente todos os `members` de todos os
  grupos. Não é preciso mexer nele.
- CMS: `config.yml` → "Equipa (por área)" → `grupos` (área + membros). A estrutura não
  muda.

**O que fazer**

1. Acrescentar a `equipa.grupos` em [src/data/equipa.json](../src/data/equipa.json) um
   novo grupo `"area": "Equipa comercial"` com os quatro membros e as funções da tabela,
   escritos como estão.
2. Acrescentar o grupo correspondente, no mesmo índice, a `equipa.equipa.grupos` em
   `pt.json`, `en.json` e `fr.json` (`area` + `members[].role`), com os textos da tabela
   abaixo.

**Nome do setor (campo `area`): Equipa comercial**

**Traduções**

| Chave | PT | EN | FR |
|---|---|---|---|
| `area` | Equipa comercial | Sales Team | Équipe commerciale |

| Nome (`members[].role`; os nomes não se traduzem) | PT | EN | FR |
|---|---|---|---|
| David Teixeira | Direção comercial | Sales Director | Direction commerciale |
| Cristina Cunha | Agente comercial | Sales Agent | Agente commerciale |
| Anabela Pereira | Agente comercial | Sales Agent | Agente commerciale |
| Catarina Santos | Agente comercial | Sales Agent | Agente commerciale |

- Em FR, as três agentes ficam na forma feminina mais usada, "Agente commerciale". Segue
  o padrão do `fr.json`, que já tem "Ingénieure civile" e "Assistante administrative".
- "Direction commerciale" é o nome da função e não varia com o género. Segue o padrão de
  "Direction de chantier".
- Em PT e EN as formas não variam.

**Não especificado**

- **Posição** do novo setor entre os três que já existem.

---

## 7. Histórico: todos os projetos marcados como concluídos e página castanha

### 7a. Todos marcados como concluídos

**Pedido:** "Na página históricos, todos os projetos devem ser marcados como concluídos."

**Onde está hoje**

- [src/pages/historico.astro](../src/pages/historico.astro) lista `porGrupo('concluido')`:
  12 projetos. O estado aparece no painel que abre ao clicar num card
  (`#emodal-estado` e a linha `entrega`). O card em si
  ([ProjectCard.astro](../src/components/ProjectCard.astro)) não mostra o estado.
- Em [src/utils/projetos.js](../src/utils/projetos.js), o grupo `concluido` dá
  `estado: 'Concluído'` **só quando o ficheiro não fixa `estado`**. Três ficheiros do grupo
  fixam outro estado:

  | Ficheiro | `estado` | `entrega` | Valor "Estado" na ficha técnica |
  |---|---|---|---|
  | `condominio-albarraque.json` | Em projeto | "Em fase de projeto · 2023" | Em projeto / Vendido |
  | `empreendimento-residencial-11-villas.json` | Em construção | (derivada) "Em construção · 2023" | Em construção / Vendido |
  | `moradia-unifamiliar-santo-antao-do-tojal.json` | Em construção | (derivada) "Em construção · 2026" | Em construção / Vendido |

- Os mesmos valores estão traduzidos por projeto em `empreendimentos.<slug>` de
  `pt.json`, `en.json` e `fr.json` (`estado`, `entrega`, `factos[3]`). Exemplos: "In
  planning", "Under construction / Sold", "En construction / Vendu". O painel lê estes
  valores (`tp(p, 'estado', ...)`), por isso eles sobrepõem-se aos do JSON quando o idioma
  muda.

**O que fazer**

1. Nos três ficheiros da tabela, em
   [src/content/empreendimentos/](../src/content/empreendimentos/), retirar o `estado` fixo
   (fica o derivado, "Concluído") ou pô-lo como `"Concluído"`. Em
   `condominio-albarraque.json`, tratar também o `entrega` fixo ("Em fase de projeto ·
   2023"). Ver **Não especificado**.
2. Atualizar `estado`, `entrega` e `factos[3]` desses três projetos em
   `empreendimentos.<slug>` de `pt.json`, `en.json` e `fr.json`, com os textos da tabela
   abaixo.
3. Confirmar no painel do Histórico que os 12 projetos mostram "Concluído", em PT, EN e
   FR.

**Traduções**

Os textos seguem o padrão dos projetos que já estão concluídos. Por exemplo, em
`condominio-tojalinho`: PT "Concluído" / "Concluído em 2022" / "Vendido"; EN "Completed" /
"Completed in 2022" / "Sold"; FR "Achevé" / "Achevé en 2022" / "Vendu". A `entrega` usa o
`ano` de cada ficheiro.

| Projeto (`ano`) | Campo | PT | EN | FR |
|---|---|---|---|---|
| `condominio-albarraque` (2023) | `estado` | Concluído | Completed | Achevé |
| | `entrega` | Concluído em 2023 | Completed in 2023 | Achevé en 2023 |
| | `factos[3]` | Vendido | Sold | Vendu |
| `empreendimento-residencial-11-villas` (2023) | `estado` | Concluído | Completed | Achevé |
| | `entrega` | Concluído em 2023 | Completed in 2023 | Achevé en 2023 |
| | `factos[3]` | Vendido | Sold | Vendu |
| `moradia-unifamiliar-santo-antao-do-tojal` (2026) | `estado` | Concluído | Completed | Achevé |
| | `entrega` | Concluído em 2026 | Completed in 2026 | Achevé en 2026 |
| | `factos[3]` | Vendido | Sold | Vendu |

Se, depois de confirmados com o cliente, o resumo da Albarraque ou o lead da página
também mudarem, os textos novos têm de ser traduzidos nos três idiomas, como o resto.

**Não especificado**

- **Texto de `entrega`.** Pelo padrão de [projetos.js](../src/utils/projetos.js), um
  projeto concluído sem `entrega` mostra "Concluído em <ano>". O pedido não diz se é este
  texto que se quer, nem se o `ano` dos três projetos está certo.
- **Resumos.** O `resumo` da Albarraque diz "Em fase de projeto, em conjunto com
  entidades…". O pedido não fala de textos descritivos.
- **Lead da página.** Em [src/data/historico.json](../src/data/historico.json) e
  `historico.concluidos.lead` (i18n), o texto diz "…dos já entregues aos que ainda estão
  em construção". O pedido não fala deste texto, mas ele contradiz "todos concluídos".

### 7b. Cards castanhos como os de "Projetos futuros" (a página continua branca)

**Pedido (retificado):** a página do Histórico **não** fica castanha. Só os **cards** ficam
castanhos, iguais aos cards da secção "Projetos futuros" do Portfólio. O fundo da página
continua branco.

**Onde está hoje**

- Cards de "Projetos futuros", [src/pages/portfolio.astro:35-36](../src/pages/portfolio.astro#L35-L36):
  estão numa `section--dark`, com fundo `--dark` `#241a12e5`, castanho escuro e
  semitransparente. A variante escura dos cards vem toda do contexto da secção
  ([styles.css:1480-1483](../public/styles.css#L1480-L1483)):
  - `.section--dark .card{ background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.34); }`
  - `.section--dark .card__title{ color:var(--paper); }`
  - `.section--dark .card__meta{ color:var(--on-dark-soft); }`
  - `.section--dark .card__tag{ color:var(--on-dark); background:rgba(255,255,255,.10); border-color:rgba(255,255,255,.18); }`
- O castanho que se vê nesses cards é **o fundo da secção a passar através** de um véu
  branco de 6%. O card não tem cor própria. Se estas regras forem aplicadas tal e qual
  sobre a página branca, o card fica branco e o texto claro deixa de se ler.
- Cards do Histórico: [historico.astro:47-49](../src/pages/historico.astro#L47-L49),
  `<ProjectCard proj={p} modal={true} />`, ou seja `<button class="card card--modal">`,
  dentro de `section section--centered-head section--flat-top` (fundo claro). A base
  `.card` está em [styles.css:1393](../public/styles.css#L1393)
  (`background:var(--card-surface); border:1px solid var(--card-rule)`). Título, meta e
  etiqueta estão em ≈1454-1470. Há tamanhos próprios do Histórico em
  `body.is-historico .card__*` (≈2967-2969).

**O que fazer**

1. **Não mexer nas classes das secções** do Histórico (não acrescentar `section--dark`,
   `has-blob` nem `<Blob />`). A secção, a seam, o título, o lead e o contacto ficam como
   estão.
2. Dar aos cards do Histórico (`body.is-historico .card--modal`) o mesmo aspeto que os
   cards de "Projetos futuros" têm no ecrã:
   - **Fundo:** uma cor castanha opaca igual à que o card de "Futuros" mostra no ecrã.
     Medir a cor renderizada desse card em `/portfolio` e usá-la aqui. Não copiar o
     `rgba(255,255,255,.06)`, pelas razões explicadas acima.
   - **Borda, título, meta e etiqueta:** os mesmos valores das regras
     `.section--dark .card*` listadas acima.
   - **Placeholder sem imagem:** `ProjectCard` aceita `dark={true}`, que troca `.ph` por
     `.ph ph--dark`. Usar se houver cards sem imagem.
3. Rever os estados de hover/foco de `.card` / `.card--modal`, para que continuem
   legíveis sobre o fundo castanho.
4. Comparar `/historico` com o bloco "Futuros" de `/portfolio`. Os cards têm de parecer
   iguais e o fundo da página tem de continuar branco.

**Traduções:** este item não altera nem acrescenta textos.

**Não especificado**

- **Painel inline** (`#epanel` / `.emodal__*`), que abre na grelha ao clicar num card.
  Não é um card, por isso, pela leitura literal, fica como está.

---

## Verificação final

- `npm run build`
- `npm run seo` (tem de passar; ver [docs/SEO.md](SEO.md))
- Script de mobile (`scripts/mobile-check.mjs`): rever os seletores `.dslider__*` depois
  do item 2.
- Ver no browser a home, `/sobre-nos` (para comparar), `/portfolio`, `/equipa` e
  `/historico` em PT, EN e FR, em desktop e telemóvel.
