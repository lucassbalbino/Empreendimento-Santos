# Aprender o projeto, passo a passo

> Guia de estudo do site "Empresa Bela". Cada módulo é **independente**: pode
> ler na ordem ou pular para o que te interessa. Em cada um há: o conceito, o que
> fizemos no projeto (com o código real), por que fizemos assim, e um exercício
> para fixar.
>
> Como usar: leia o módulo → abra os ficheiros citados → faça o exercício →
> rode `npm run build` para ver o efeito.

---

## Índice

- [Módulo 0 — O quadro geral (mapa mental)](#módulo-0--o-quadro-geral-mapa-mental)
- [Módulo 1 — Conceitos: estático, CMS, headless, Git-based](#módulo-1--conceitos-estático-cms-headless-git-based)
- [Módulo 2 — A pilha: Astro, Sveltia, Cloudflare](#módulo-2--a-pilha-astro-sveltia-cloudflare)
- [Módulo 3 — Estrutura de pastas do projeto](#módulo-3--estrutura-de-pastas-do-projeto)
- [Módulo 4 — Scaffold do Astro (do zero ao "Hello")](#módulo-4--scaffold-do-astro-do-zero-ao-hello)
- [Módulo 5 — Layout e componentes (.astro)](#módulo-5--layout-e-componentes-astro)
- [Módulo 6 — Separar conteúdo do design (os JSON)](#módulo-6--separar-conteúdo-do-design-os-json)
- [Módulo 7 — Listas: como nascem os "cards" editáveis](#módulo-7--listas-como-nascem-os-cards-editáveis)
- [Módulo 8 — O painel: Sveltia CMS e o config.yml](#módulo-8--o-painel-sveltia-cms-e-o-configyml)
- [Módulo 9 — Modo local: editar sem GitHub](#módulo-9--modo-local-editar-sem-github)
- [Módulo 10 — Build e deploy (Cloudflare Pages)](#módulo-10--build-e-deploy-cloudflare-pages)
- [Módulo 11 — Login do cliente (OAuth) explicado](#módulo-11--login-do-cliente-oauth-explicado)
- [Módulo 12 — Analytics de visitantes](#módulo-12--analytics-de-visitantes)
- [Módulo 13 — Manutenção: adicionar campo, seção, página](#módulo-13--manutenção-adicionar-campo-seção-página)
- [Glossário](#glossário)

---

## Módulo 0 — O quadro geral (mapa mental)

**Objetivo:** entender, em uma imagem, como tudo se conecta.

```
                          ┌────────────────────────┐
   Cliente edita  ─────►  │  PAINEL  (/admin)       │   Sveltia CMS
                          │  Sveltia CMS            │
                          └───────────┬────────────┘
                                      │ grava
                                      ▼
                          ┌────────────────────────┐
                          │  CONTEÚDO               │   src/data/*.json
                          │  src/data/*.json (Git)  │   (textos, fotos, listas)
                          └───────────┬────────────┘
                                      │ é lido por
                                      ▼
                          ┌────────────────────────┐
                          │  SITE (Astro)           │   src/pages + components
                          │  monta o HTML final     │
                          └───────────┬────────────┘
                                      │ npm run build
                                      ▼
                          ┌────────────────────────┐
                          │  dist/  (HTML pronto)   │   publicado na Cloudflare
                          └────────────────────────┘
```

**A ideia central:** o **conteúdo** vive separado do **código**. O painel só mexe
no conteúdo (JSON); o Astro transforma esse conteúdo em HTML; a Cloudflare serve
o HTML e mede as visitas.

**Como estudar:** guarde esses 4 blocos (Painel → Conteúdo → Site → Publicação).
Todos os módulos seguintes detalham um deles.

---

## Módulo 1 — Conceitos: estático, CMS, headless, Git-based

**Objetivo:** dominar o vocabulário antes do código.

- **Site estático**: HTML/CSS/JS prontos, sem servidor que "monta" a página a
  cada visita. Rápido e seguro, mas o conteúdo está "chumbado" no código. Era o
  caso do mockup original (`index.html`, `portfolio.html`, `sobre-nos.html`).
- **CMS (Content Management System)**: sistema para **gerir conteúdo** — editar
  textos e fotos sem programar. (Não confundir com **CRM**, que gere
  clientes/leads.)
- **CMS tradicional (ex.: WordPress)**: o CMS e o site são a mesma coisa,
  rodando num servidor com banco de dados. Flexível, porém pesado e com
  manutenção (atualizações, segurança).
- **CMS headless**: o painel de edição é **separado** do site. O site continua
  estático e rápido; o painel só fornece o conteúdo. "Headless" = "sem cabeça" =
  o CMS não impõe a aparência.
- **Git-based CMS** (o nosso caso): um tipo de headless onde o conteúdo é
  **guardado como ficheiros no Git** (controle de versão). Vantagem: histórico
  de tudo, reversão fácil, custo ~zero, sem banco de dados.

**Por que escolhemos Git-based:** o cliente quer **trocar fotos/textos e
adicionar cards** (não inventar seções do zero). Para isso, headless Git-based dá
o melhor equilíbrio entre custo, segurança e autonomia.

**Exercício:** explique, com suas palavras, a diferença entre CMS e CRM, e por
que o site continua "estático" mesmo sendo editável.

---

## Módulo 2 — A pilha: Astro, Sveltia, Cloudflare

**Objetivo:** saber o papel de cada ferramenta.

| Ferramenta | Papel | Analogia |
|---|---|---|
| **Astro** | Gerador de site estático. Lê os dados + componentes e produz HTML. | A "fábrica" que monta as páginas. |
| **Sveltia CMS** | Painel de edição em `/admin`. Lê/escreve os JSON. | O "balcão de atendimento" onde o cliente edita. |
| **Cloudflare Pages** | Hospedagem + publicação automática. | O "terreno" onde o site fica no ar. |
| **Cloudflare Web Analytics** | Métricas de visitantes. | O "contador de visitas". |
| **Git / GitHub** | Histórico e fonte da verdade do conteúdo. | O "arquivo morto" versionado. |

**Por que Astro (e não WordPress):** Astro **não impõe estética** — é o nosso
HTML/CSS, só organizado. Mantém o site rápido e o design 100% livre.

**Por que Sveltia (e não Decap):** Sveltia é um sucessor moderno do Decap CMS,
mesma base de configuração (`config.yml`), interface melhor, gratuito.

**Exercício:** para cada ferramenta acima, escreva uma frase do tipo "se ela não
existisse, o que faltaria?".

---

## Módulo 3 — Estrutura de pastas do projeto

**Objetivo:** saber onde fica cada coisa.

```
mockup/
├── astro.config.mjs        # configuração do Astro
├── package.json            # dependências e scripts (npm run dev/build/...)
├── public/                 # ficheiros servidos "como estão"
│   ├── styles.css          #   CSS do site (reusado do mockup)
│   ├── main.js             #   JS do site (header, contadores, menu mobile)
│   ├── images/             #   fotos enviadas pelo painel
│   └── admin/              #   o PAINEL
│       ├── index.html      #     carrega o Sveltia CMS
│       └── config.yml      #     define o que é editável
├── src/                    # o código-fonte do site
│   ├── data/               #   o CONTEÚDO editável (JSON)
│   │   ├── home.json
│   │   ├── portfolio.json
│   │   ├── sobre.json
│   │   └── site.json       #   logo + rodapé (partilhado)
│   ├── layouts/
│   │   └── Base.astro      #   "moldura" comum a todas as páginas
│   ├── components/         #   peças reutilizáveis
│   │   ├── Header.astro  Footer.astro  Hero.astro
│   │   ├── Stats.astro  CardScroller.astro  BlockHead.astro
│   │   ├── Team.astro  ContactForm.astro
│   └── pages/              #   uma página = uma rota
│       ├── index.astro     #   → /
│       ├── portfolio.astro #   → /portfolio
│       └── sobre-nos.astro #   → /sobre-nos
└── docs/                   # documentação (este ficheiro, guia, publicação)
```

**Regras de ouro:**
- `src/pages/` → cada ficheiro vira uma **rota** (URL).
- `src/data/` → o **conteúdo** que o cliente edita.
- `src/components/` → **peças visuais** reutilizáveis.
- `public/` → vai para o site **sem processamento** (CSS, JS, imagens, painel).

**Exercício:** sem olhar, diga em que pasta você mexeria para (a) trocar a cor de
um botão, (b) editar o texto do hero, (c) criar uma página `/contactos`.

---

## Módulo 4 — Scaffold do Astro (do zero ao "Hello")

**Objetivo:** entender os comandos que ligaram o projeto.

O que rodamos:

```bash
git init                 # inicia o controle de versão (o CMS é Git-based)
npm init -y              # cria o package.json
npm install astro@^4     # instala o Astro
```

Depois, `astro.config.mjs` (configuração mínima):

```js
import { defineConfig } from 'astro/config';
export default defineConfig({});
```

E os **scripts** no `package.json` (atalhos de terminal):

```json
"scripts": {
  "dev": "astro dev",        // servidor de desenvolvimento (localhost:4321)
  "build": "astro build",    // gera o site final em dist/
  "preview": "astro preview",// pré-visualiza o dist/ como em produção
  "cms-proxy": "decap-server"// backend local do painel (Módulo 9)
}
```

**Por quê:** `npm` gere as bibliotecas; os scripts evitam decorar comandos longos.
`git init` foi necessário já no começo porque o conteúdo será versionado.

**Conceito — `dev` vs `build`:**
- `npm run dev`: recarrega ao vivo enquanto você edita. Use para desenvolver.
- `npm run build`: gera os HTML definitivos em `dist/`. É o que vai pro ar.

**Exercício:** rode `npm run dev`, abra `http://localhost:4321`, edite um texto
em `src/data/home.json` e veja recarregar. Depois rode `npm run build` e procure
o texto em `dist/index.html`.

---

## Módulo 5 — Layout e componentes (.astro)

**Objetivo:** entender a anatomia de um ficheiro `.astro` e o reuso.

Um componente `.astro` tem **duas partes**:

```astro
---
// 1) FRONTMATTER (JavaScript): roda no build, prepara os dados
const { title } = Astro.props;   // recebe "props" de quem o usa
---
<!-- 2) TEMPLATE (HTML): o que será renderizado -->
<h1>{title}</h1>                  <!-- {} insere valores do JS -->
```

**O layout base** (`src/layouts/Base.astro`) é a moldura comum: `<head>`, fontes,
CSS, `<Header/>`, um `<slot/>` (onde entra o conteúdo da página), `<Footer/>` e os
scripts. Trecho real:

```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
const { title } = Astro.props;
---
<html lang="pt">
  <head> ... <link rel="stylesheet" href="/styles.css"> </head>
  <body>
    <Header />
    <slot />        <!-- aqui entra o miolo de cada página -->
    <Footer />
    <script is:inline src="/main.js"></script>
  </body>
</html>
```

**`<slot/>`** é o "buraco" onde cada página injeta o seu conteúdo. Assim, header e
footer são escritos **uma vez** e aparecem em todas as páginas.

**Componente que repete cards** (`src/components/CardScroller.astro`):

```astro
---
const { cards, dark = false } = Astro.props;   // recebe uma lista
---
<div class="scroller">
  {cards.map((c) => (                          // .map = "para cada card, gere..."
    <article class="card">
      <div class={dark ? "ph ph--dark" : "ph"}></div>
      <h3 class="card__title">{c.title}</h3>
      <div class="card__meta">{c.meta}</div>
      {c.cta && <span class="card__cta">{c.cta}</span>}  <!-- só se existir -->
    </article>
  ))}
</div>
```

**Por quê:** DRY ("Don't Repeat Yourself"). Em vez de copiar o HTML de cada card,
descrevemos **um** card e mandamos a lista. Adicionar um card vira adicionar um
item na lista — base de toda a edição pelo painel (Módulo 7).

**`is:inline`:** dissemos ao Astro para **não** empacotar o `main.js` (ele já está
pronto em `public/`). Sem isso, o build dava erro.

**Exercício:** abra `src/components/Stats.astro` e explique como ele transforma a
lista de contadores em vários blocos `.stat`. Depois identifique no `index.astro`
onde o `CardScroller` é usado duas vezes (portfólio e track record).

---

## Módulo 6 — Separar conteúdo do design (os JSON)

**Objetivo:** entender o coração da editabilidade.

Antes, o texto estava dentro do HTML:

```html
<h1 class="display">Lorem ipsum dolor sit amet</h1>
```

Agora, o texto está num **dado** (`src/data/home.json`):

```json
{ "hero": { "title": "Lorem ipsum dolor sit amet" } }
```

…e a página apenas **lê** esse dado (`src/pages/index.astro`):

```astro
---
import home from '../data/home.json';   // importa o conteúdo
import Hero from '../components/Hero.astro';
---
<Hero title={home.hero.title} />        <!-- usa o valor -->
```

**O fluxo completo:** `home.json` (dado) → `index.astro` (lê) → `Hero.astro`
(desenha) → HTML final.

**Por quê:** quem edita o JSON (o painel, ou você) muda o site **sem tocar no
código**. O design fica protegido; só o conteúdo muda.

**Exercício:** mude `hero.title` em `home.json`, rode `npm run build` e confirme
no `dist/index.html`. Depois reverta. (Foi exatamente este teste que validou o
projeto.)

---

## Módulo 7 — Listas: como nascem os "cards" editáveis

**Objetivo:** entender por que o cliente consegue **adicionar** um projeto/serviço.

No JSON, uma seção de cards é um **array** (lista):

```json
"portfolio": {
  "cards": [
    { "title": "Lorem Ipsum", "meta": "Dolor sit amet", "cta": "Lorem ipsum" },
    { "title": "Dolor Sit",   "meta": "Amet consectetur", "cta": "Lorem ipsum" }
  ]
}
```

A página percorre o array com `.map` (Módulo 5). **Resultado:** se o array tem 2
itens, saem 2 cards; se tem 7, saem 7. **Adicionar um card = adicionar um objeto
ao array.** É isso que o botão "+ Adicionar" do painel faz por baixo.

No projeto, são listas: `home.oQueFazemos.stats` (contadores),
`home.portfolio.cards`, `home.trackRecord.cards`, `home.equipa.members`,
`portfolio.projetos`, `sobre.oQueFazemos.imagens.colunaA` (fotos da grelha),
`sobre.servicos.items`, `sobre.equipa.members`.

**Item vs. tipo de seção (a distinção-chave):**
- Adicionar **um item** a uma lista existente → o **cliente** faz, no painel.
- Criar um **tipo de seção novo** → trabalho de **desenvolvedor** (Módulo 13).

**Exercício:** em `src/data/portfolio.json`, acrescente um objeto novo ao array
`projetos` (copie um existente e mude o `nome`). Rode `npm run build` e veja
aparecer no grid. Depois remova.

---

## Módulo 8 — O painel: Sveltia CMS e o config.yml

**Objetivo:** entender como o painel sabe o que mostrar.

O painel são **dois ficheiros** em `public/admin/`:

1. `index.html` — carrega o programa do Sveltia:

```html
<body>
  <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
</body>
```

2. `config.yml` — **descreve** o que é editável. É o cérebro do painel.

Estrutura do `config.yml`:

```yaml
backend:                 # onde o conteúdo é guardado
  name: github
  repo: SEU_USUARIO/empresa-bela
  branch: main
local_backend: true      # permite editar localmente (Módulo 9)
media_folder: "public/images"   # onde as fotos enviadas ficam
public_folder: "/images"        # como o site as referencia

collections:             # cada "coleção" = uma página/área editável
  - name: home
    label: "Página Início"
    files:
      - name: home
        file: "src/data/home.json"   # liga ao ficheiro de conteúdo
        fields:                       # os campos do formulário
          - label: "Hero"
            name: hero
            widget: object
            fields:
              - { label: "Título", name: title, widget: string }
```

**A regra de ouro:** a estrutura dos `fields` no `config.yml` tem de **espelhar**
a estrutura do JSON. `hero.title` no JSON ↔ um campo `hero` (object) com filho
`title` (string) no config.

**Widgets** (tipos de campo) que usamos:
- `string` — texto curto (título).
- `text` — texto longo (parágrafo/bio).
- `number` — número (valor de contador).
- `image` — upload de foto.
- `object` — um grupo de campos (ex.: o hero).
- `list` — uma **lista repetível** (os cards! ver Módulo 7). É o `list` que cria
  o botão "+ Adicionar".

Exemplo de `list` (o que dá poder ao cliente):

```yaml
- label: "Cards"
  name: cards
  widget: list
  summary: "{{fields.title}}"   # como cada item aparece resumido na lista
  fields:
    - { label: "Título", name: title, widget: string }
    - { label: "Legenda", name: meta, widget: string }
    - { label: "Texto CTA", name: cta, widget: string, required: false }
```

**Por quê YAML:** é um formato de configuração legível (indentação importa!).
Um espaço errado quebra o ficheiro — por isso validámos o YAML antes de usar.

**Exercício:** abra `public/admin/config.yml` e encontre a coleção `portfolio`.
Identifique o `widget: list` chamado `projetos` e confira que os campos
(`nome`, `localizacao`, `tipologia`, `cta`, `foto`) batem com o
`src/data/portfolio.json`.

---

## Módulo 9 — Modo local: editar sem GitHub

**Objetivo:** entender como testamos o painel sem nenhuma conta.

O painel Git-based normalmente grava no GitHub. Mas para **demonstrar** sem conta,
existe o **modo local**: o painel grava direto nos ficheiros do seu PC.

Duas peças:
1. `local_backend: true` no `config.yml`.
2. Um **proxy** que dá ao painel permissão de escrever em disco:

```bash
npm run cms-proxy   # roda o "decap-server" na porta 8081
```

Fluxo para o demo:

```bash
npm run dev         # terminal 1: site
npm run cms-proxy   # terminal 2: backend local
```

Abra `http://localhost:4321/admin/index.html` → escolha **"Work with Local
Repository"** → edite → salva direto em `src/data/*.json`.

**Detalhe técnico:** em desenvolvimento, o Astro serve `/admin/index.html` (e não
`/admin/` "puro"). Em produção, a Cloudflare serve `/admin/` normalmente. Por isso
o endereço local tem o `/index.html`.

**Por quê:** assim você (e o cliente) veem o painel funcionando **antes** de
publicar, sem criar contas. Ótimo para apresentação.

**Exercício:** rode os dois comandos, abra o painel em modo local, mude um título
e confirme que o `src/data/home.json` mudou no editor.

---

## Módulo 10 — Build e deploy (Cloudflare Pages)

**Objetivo:** entender como o site vai ao ar e se atualiza sozinho.

**Build:** `npm run build` lê `src/` e gera HTML pronto em `dist/`:

```
dist/
├── index.html          → /
├── portfolio/index.html → /portfolio
├── sobre-nos/index.html → /sobre-nos
├── admin/              → o painel
├── styles.css  main.js images/
```

**Deploy automático (Cloudflare Pages):**
1. O código vive no GitHub.
2. A Cloudflare é ligada ao repositório, com:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. **Cada push no GitHub** dispara um build novo e republica.

**O ciclo de edição do cliente, por inteiro:**

```
cliente salva no painel → painel faz commit no GitHub → Cloudflare detecta o
push → roda npm run build → publica o dist/ → no ar em ~1 min
```

**Por quê estático na Cloudflare:** rápido (CDN mundial), barato (grátis) e
seguro (não há servidor/banco para invadir).

**Exercício:** leia `docs/PUBLICACAO.md` seção 2 e liste os 3 campos de
configuração do build na Cloudflare.

---

## Módulo 11 — Login do cliente (OAuth) explicado

**Objetivo:** desmistificar a única parte "complicada".

O painel precisa garantir que **só pessoas autorizadas** editem. Como o conteúdo
está no GitHub, o login é feito **pelo GitHub** via um protocolo chamado **OAuth**.

**O que é OAuth (em uma frase):** é "entrar com o GitHub" — o cliente autoriza o
painel a agir em seu nome, sem partilhar a senha.

**Por que precisa de um "worker":** por segurança, o GitHub exige um
intermediário (um pequeno programa) que guarda o segredo da aplicação e completa
o login. Usamos o **`sveltia-cms-auth`**, um worker gratuito que roda na
Cloudflare.

Fluxo do login:

```
cliente clica "Login" → é enviado ao GitHub → autoriza → o worker confirma →
painel liberado para editar
```

Passos (resumidos; detalhe em `docs/PUBLICACAO.md` seção 3):
1. Criar um "OAuth App" no GitHub (gera Client ID + Secret).
2. Fazer deploy do worker `sveltia-cms-auth` na Cloudflare com esses segredos.
3. Apontar o `config.yml` para o worker (`base_url`).

**Para a demonstração:** nada disso é necessário — o modo local (Módulo 9)
dispensa o login.

**Exercício:** explique, sem jargão, por que não colocamos a senha do cliente
dentro do site (e por que o OAuth é mais seguro).

---

## Módulo 12 — Analytics de visitantes

**Objetivo:** entender como medimos as visitas.

Usamos **Cloudflare Web Analytics**: grátis, sem cookies (sem aviso de LGPD),
zero manutenção. Mede visitas, páginas mais vistas e origem do tráfego.

Como está no projeto — um trecho no fim do `src/layouts/Base.astro` (logo aparece
em **todas** as páginas, por estar no layout):

```astro
<!-- Cloudflare Web Analytics — substituir TOKEN ao publicar -->
<script is:inline defer src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "TOKEN_DO_CLOUDFLARE"}'></script>
```

Para ativar (na publicação): gerar o token no painel da Cloudflare e trocar
`TOKEN_DO_CLOUDFLARE` pelo valor real (ver `docs/PUBLICACAO.md` seção 4).

**Por que no `Base.astro`:** porque o layout é partilhado — colocar uma vez cobre
o site inteiro (DRY de novo).

**Exercício:** explique por que esse `<script>` no layout vale para `/`,
`/portfolio` e `/sobre-nos` ao mesmo tempo.

---

## Módulo 13 — Manutenção: adicionar campo, seção, página

**Objetivo:** saber estimar e executar mudanças futuras.

**A) Adicionar um campo editável a uma seção existente** (fácil, ~minutos):
1. Acrescente a chave no JSON (ex.: `hero.subtitulo`).
2. Use no componente/página (`{home.hero.subtitulo}`).
3. Adicione o campo no `config.yml` (um `widget: string`).

**B) Criar um tipo de seção novo** (ex.: "Depoimentos") (moderado):
1. Crie o componente `src/components/Testimonials.astro`.
2. Adicione os dados no JSON (uma lista de depoimentos).
3. Use o componente na página.
4. Modele a lista no `config.yml`.
> É isto que o **cliente não faz sozinho** — exige código.

**C) Criar uma página nova** (ex.: `/contactos`) (moderado):
1. Crie `src/pages/contactos.astro` usando `Base`.
2. (Opcional) `src/data/contactos.json` + coleção no `config.yml`.
3. A rota `/contactos` passa a existir automaticamente.

**Regra mental de esforço:** "mais um da mesma família" = cliente, segundos.
"Família nova" = desenvolvedor, trabalho moderado. "Mudar o visual" = só CSS,
sem risco ao conteúdo.

**Exercício:** planeje (sem implementar) os passos para adicionar um campo
"subtítulo" ao hero da Início. Liste o que muda em cada um dos 3 lugares.

---

## Glossário

- **Astro**: gerador de site estático que monta HTML a partir de componentes.
- **Build**: processo que transforma `src/` em HTML final (`dist/`).
- **CDN**: rede de servidores que entrega o site rápido no mundo todo.
- **CMS**: sistema de gestão de **conteúdo** (textos/fotos).
- **CRM**: sistema de gestão de **clientes/leads** (≠ CMS).
- **Componente**: peça reutilizável de interface (`.astro`).
- **Deploy**: publicar o site num servidor.
- **DRY**: "não se repita" — escrever algo uma vez e reutilizar.
- **Git**: controle de versão; guarda o histórico de mudanças.
- **Headless**: CMS separado do site (não impõe aparência).
- **JSON**: formato de dados (pares chave/valor) — onde mora o conteúdo.
- **Layout**: moldura comum às páginas (`Base.astro`).
- **OAuth**: "entrar com o GitHub" sem partilhar senha.
- **Props**: dados passados para um componente.
- **Proxy (decap-server)**: ponte que deixa o painel gravar localmente.
- **Rota**: o endereço/URL de uma página.
- **Slot**: o "buraco" do layout onde entra o conteúdo da página.
- **Widget**: tipo de campo no painel (string, text, image, list, object…).
- **YAML**: formato de configuração legível (indentação importa) — o `config.yml`.
```
