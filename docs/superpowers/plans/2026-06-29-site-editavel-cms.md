# Site Editável (Git-based CMS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converter o mockup estático (3 páginas HTML) em um site Astro orientado a dados, editável pelo cliente via Sveltia CMS, com analytics — rodando localmente como demonstração, sem visual nenhum alterado.

**Architecture:** Astro gera o site estático a partir de componentes `.astro` que leem o conteúdo de arquivos JSON em `src/data/`. O Sveltia CMS (`public/admin/`) edita esses mesmos JSON via Git. O CSS/JS atuais são reaproveitados sem mudança. Listas (portfólio, serviços, equipa, stats) viram arrays editáveis pelo cliente.

**Tech Stack:** Astro 4, Sveltia CMS, JSON de conteúdo, Cloudflare Web Analytics (snippet), Node 18+.

## Global Constraints

- **Visual idêntico ao mockup atual** — nenhum HTML renderizado, classe CSS ou comportamento JS pode mudar. `styles.css` e `main.js` são copiados sem edição.
- **Conteúdo placeholder preservado** — manter os textos Lorem ipsum e os data-attributes dos contadores (`data-target`, `data-prefix`, `data-suffix`).
- **Português** em toda config visível ao cliente (labels do CMS, guia).
- **Custo zero** — só ferramentas gratuitas; demo roda 100% local sem contas externas.
- **Node 18+**, gerenciador `npm`.
- Conteúdo editável vive em `src/data/*.json`; mídia em `public/images/`.

---

### Task 1: Scaffold do projeto Astro

**Files:**
- Create: `package.json`, `astro.config.mjs`, `.gitignore`, `tsconfig.json`
- Create: `public/styles.css` (cópia de `styles.css`), `public/main.js` (cópia de `main.js`)
- Create: `src/pages/index.astro` (temporário, smoke test)

**Interfaces:**
- Produces: projeto Astro buildável; `npm run dev` serve em `http://localhost:4321`; CSS/JS disponíveis em `/styles.css` e `/main.js`.

- [ ] **Step 1: Inicializar git e package.json**

```bash
cd "C:/Users/lcbty/Claude/Projects/Empresa Bela/mockup"
git init
npm init -y
```

- [ ] **Step 2: Instalar Astro**

```bash
npm install astro@^4
```

- [ ] **Step 3: Criar `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  // site estático puro; sem integrações por ora
});
```

- [ ] **Step 4: Criar `.gitignore`**

```
node_modules/
dist/
.astro/
```

- [ ] **Step 5: Copiar assets atuais para `public/`**

```bash
cp styles.css public/styles.css
cp main.js public/main.js
```

- [ ] **Step 6: Criar `src/pages/index.astro` (smoke test)**

```astro
---
---
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><link rel="stylesheet" href="/styles.css"></head>
<body><h1 class="display">Astro OK</h1></body>
</html>
```

- [ ] **Step 7: Adicionar scripts ao `package.json`**

Garantir em `"scripts"`: `"dev": "astro dev"`, `"build": "astro build"`, `"preview": "astro preview"`.

- [ ] **Step 8: Verificar build**

Run: `npm run build`
Expected: build conclui sem erro; cria `dist/index.html`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project, reuse existing css/js"
```

---

### Task 2: Layout base + Header + Footer

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/data/site.json`

**Interfaces:**
- Consumes: nada.
- Produces: `Base.astro` aceita prop `title: string` e renderiza `<head>` (fontes Google + `/styles.css`), `<Header/>`, `<slot/>`, `<Footer/>`, e `<script src="/main.js">`. `site.json` fornece dados do header/footer.

- [ ] **Step 1: Criar `src/data/site.json`**

```json
{
  "brand": { "name": "Logo", "suffix": "Lorem" },
  "footer": {
    "blurb": "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod.",
    "morada": "Lorem ipsum nº 0\n0000-000 Lorem\nIpsum",
    "email": "lorem@ipsum.com",
    "telefone": "+000 000 000 000",
    "copyright": "© 0000 Lorem Ipsum — Todos os direitos reservados"
  }
}
```

- [ ] **Step 2: Criar `src/components/Header.astro`**

Portar o markup do `<header class="site-header">…</header>` de `index.html` (linhas 14-32) literalmente para este componente. Substituir o texto do logo por `{site.brand.name}` / `{site.brand.suffix}`. Importar `import site from '../data/site.json'` no frontmatter. Os itens de menu permanecem fixos (fora de escopo).

- [ ] **Step 3: Criar `src/components/Footer.astro`**

Portar o markup do `<footer class="site-footer">…</footer>` (linhas 169-197) literalmente. Ligar logo, blurb, morada (renderizar `\n` como `<br>`), email, telefone e copyright a `site.json`.

- [ ] **Step 4: Criar `src/layouts/Base.astro`**

```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <Header />
  <slot />
  <Footer />
  <script src="/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: build sem erro.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: base layout with header/footer driven by site.json"
```

---

### Task 3: Migrar a Início (index) com dados editáveis

**Files:**
- Create: `src/data/home.json`
- Create: `src/components/Hero.astro`, `src/components/Stats.astro`, `src/components/CardScroller.astro`, `src/components/Team.astro`, `src/components/ContactForm.astro`
- Modify: `src/pages/index.astro` (substituir o smoke test)

**Interfaces:**
- Consumes: `Base.astro`.
- Produces: componentes reutilizáveis. `Hero` prop `{ title, minHeight? }`. `Stats` prop `{ items: {target,prefix?,suffix?,label}[] }`. `CardScroller` prop `{ cards: {title,meta,cta?,dark?}[] }`. `Team` prop `{ members: {role,name,bio}[] }`. `ContactForm` sem props (markup fixo).

- [ ] **Step 1: Criar `src/data/home.json`**

```json
{
  "hero": { "title": "Lorem ipsum dolor sit amet" },
  "quemSomos": {
    "title": "Lorem ipsum dolor sit amet consectetur",
    "paragrafos": [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
      "Ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse."
    ],
    "botao": "Lorem ipsum"
  },
  "oQueFazemos": {
    "title": "Lorem — Ipsum — Dolor",
    "stats": [
      { "target": 120, "prefix": "", "suffix": "", "label": "Lorem ipsum" },
      { "target": 2400, "prefix": "", "suffix": "", "label": "Dolor sit amet" },
      { "target": 85, "prefix": "", "suffix": "", "label": "Consectetur" },
      { "target": 350, "prefix": "+", "suffix": "", "label": "Adipiscing elit" },
      { "target": 900, "prefix": "", "suffix": "K", "label": "Tempor incididunt" }
    ]
  },
  "portfolio": {
    "title": "Lorem ipsum dolor", "lead": "Consectetur adipiscing elit", "botao": "Lorem ipsum",
    "cards": [
      { "title": "Lorem Ipsum", "meta": "Dolor sit amet, consectetur", "cta": "Lorem ipsum" },
      { "title": "Dolor Sit", "meta": "Amet consectetur, adipiscing", "cta": "Lorem ipsum" },
      { "title": "Amet Elit", "meta": "Sed do eiusmod, tempor", "cta": "Lorem ipsum" },
      { "title": "Tempor Magna", "meta": "Incididunt ut, labore", "cta": "Lorem ipsum" },
      { "title": "Aliqua Enim", "meta": "Ad minim, veniam quis", "cta": "Lorem ipsum" }
    ]
  },
  "trackRecord": {
    "title": "Lorem ipsum dolor sit", "lead": "Consectetur adipiscing", "botao": "Lorem ipsum",
    "cards": [
      { "title": "Lorem Building", "meta": "Dolor sit amet, consectetur" },
      { "title": "Ipsum Lofts", "meta": "Amet consectetur, adipiscing" },
      { "title": "Dolor Plaza", "meta": "Sed do eiusmod, tempor" },
      { "title": "Magna Court", "meta": "Incididunt ut, labore" },
      { "title": "Aliqua House", "meta": "Ad minim, veniam quis" }
    ]
  },
  "equipa": {
    "title": "Lorem ipsum dolor sit amet",
    "members": [
      { "role": "Lorem · Ipsum", "name": "Lorem Ipsum Dolor", "bio": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam quis nostrud." },
      { "role": "Dolor · Amet", "name": "Consectetur Adipiscing", "bio": "Ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla." }
    ]
  }
}
```

- [ ] **Step 2: Criar `src/components/Stats.astro`**

```astro
---
const { items } = Astro.props;
---
<div class="stats">
  {items.map((s) => (
    <div class="stat">
      <div class="stat__num" data-target={s.target} data-prefix={s.prefix} data-suffix={s.suffix}>0</div>
      <div class="stat__label">{s.label}</div>
    </div>
  ))}
</div>
```

- [ ] **Step 3: Criar `src/components/CardScroller.astro`**

```astro
---
const { cards, dark = false } = Astro.props;
---
<div class="scroller">
  {cards.map((c) => (
    <article class="card">
      <div class="card__media">
        <div class={dark ? "ph ph--dark" : "ph"}></div>
        <div class="card__overlay">
          <h3 class="card__title">{c.title}</h3>
          <div class="card__meta">{c.meta}</div>
          {c.cta && <span class="card__cta">{c.cta}</span>}
        </div>
      </div>
    </article>
  ))}
</div>
```

- [ ] **Step 4: Criar `Hero.astro`, `Team.astro`, `ContactForm.astro`**

Portar markup literal de `index.html`: Hero (linhas 34-44, title via prop), Team (`<div class="team">` com `.map` sobre members, markup do membro linhas 130-135), ContactForm (linhas 147-167, markup fixo).

- [ ] **Step 5: Reescrever `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import Stats from '../components/Stats.astro';
import CardScroller from '../components/CardScroller.astro';
import Team from '../components/Team.astro';
import ContactForm from '../components/ContactForm.astro';
import home from '../data/home.json';
---
<Base title="Mockup — Início">
  <Hero title={home.hero.title} />
  <!-- Quem Somos: portar markup das linhas 46-60 ligando a home.quemSomos -->
  <section class="section section--alt">
    <div class="container dofazemos">
      <h2 class="display" set:html={home.oQueFazemos.title.replace('Ipsum', '<em>Ipsum</em>')}></h2>
      <Stats items={home.oQueFazemos.stats} />
    </div>
  </section>
  <!-- Portfólio: block-head (linhas 80-87) + CardScroller -->
  <section class="section"><div class="container"><!-- block-head ligado a home.portfolio --></div>
    <div class="container"><CardScroller cards={home.portfolio.cards} /></div>
  </section>
  <section class="section section--dark"><div class="container"><!-- block-head home.trackRecord --></div>
    <div class="container"><CardScroller cards={home.trackRecord.cards} dark={true} /></div>
  </section>
  <section class="section section--alt"><div class="container">
    <h2 class="display display--sm">{home.equipa.title}</h2>
    <Team members={home.equipa.members} />
  </div></section>
  <section class="section" id="contacto"><div class="container"><ContactForm /></div></section>
</Base>
```

- [ ] **Step 6: Verificar paridade visual**

Run: `npm run dev` e abrir `http://localhost:4321`.
Expected: a página Início é visualmente idêntica ao `index.html` original (mesmo hero, 5 contadores animando, carrosséis, equipa, contacto). Comparar lado a lado com o HTML antigo.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: migrate home page to data-driven Astro components"
```

---

### Task 4: Migrar Portfólio (lista de projetos editável)

**Files:**
- Create: `src/data/portfolio.json`
- Create: `src/pages/portfolio.astro`

**Interfaces:**
- Consumes: `Base.astro`, `CardScroller.astro`, `ContactForm.astro`.
- Produces: página `/portfolio` com grid de projetos vindo de `portfolio.json` (array `projetos`).

- [ ] **Step 1: Ler `portfolio.html`**

Run: abrir `portfolio.html` para extrair textos e a estrutura do grid de projetos.

- [ ] **Step 2: Criar `src/data/portfolio.json`**

Estruturar `{ hero: {title}, intro: {...}, projetos: [{ nome, localizacao, tipologia, descricao }], trackRecord: {...} }` preenchido com o conteúdo placeholder atual de `portfolio.html`.

- [ ] **Step 3: Criar `src/pages/portfolio.astro`**

Montar com `Base`, portando o markup de `portfolio.html` e iterando `portfolio.projetos` no grid (mesmas classes CSS do original).

- [ ] **Step 4: Verificar paridade visual**

Run: abrir `http://localhost:4321/portfolio`.
Expected: idêntico ao `portfolio.html` original.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: migrate portfolio page with editable project list"
```

---

### Task 5: Migrar Sobre Nós

**Files:**
- Create: `src/data/sobre.json`
- Create: `src/pages/sobre-nos.astro`

**Interfaces:**
- Consumes: `Base.astro`, `Team.astro`, `ContactForm.astro`.
- Produces: página `/sobre-nos` com verticais e serviços vindos de `sobre.json` (arrays `verticais`, `servicos`).

- [ ] **Step 1: Ler `sobre-nos.html`** e extrair conteúdo/estrutura.

- [ ] **Step 2: Criar `src/data/sobre.json`** com `{ hero, quemSomos, verticais: [...], servicos: [...], equipa: {...} }` preenchido do placeholder atual.

- [ ] **Step 3: Criar `src/pages/sobre-nos.astro`** portando o markup e iterando `verticais` e `servicos`.

- [ ] **Step 4: Verificar paridade visual**

Run: abrir `http://localhost:4321/sobre-nos`.
Expected: idêntico ao `sobre-nos.html` original.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: migrate sobre-nos page (verticais + servicos editáveis)"
```

---

### Task 6: Painel de edição Sveltia CMS (com modo local)

**Files:**
- Create: `public/admin/index.html`
- Create: `public/admin/config.yml`

**Interfaces:**
- Consumes: arquivos `src/data/*.json`.
- Produces: painel em `/admin` que edita os JSON; `local_backend: true` permite editar localmente sem GitHub.

- [ ] **Step 1: Criar `public/admin/index.html`**

```html
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Editar o site</title>
</head>
<body>
  <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar `public/admin/config.yml`**

```yaml
backend:
  name: github
  repo: SEU_USUARIO/empresa-bela   # ajustar na publicação
  branch: main
local_backend: true                # permite editar localmente na demo
media_folder: "public/images"
public_folder: "/images"
collections:
  - name: home
    label: "Página Início"
    files:
      - name: home
        label: "Conteúdo da Início"
        file: "src/data/home.json"
        fields:
          - { label: "Hero — Título", name: hero, widget: object, fields: [ { label: Título, name: title, widget: string } ] }
          - label: "O Que Fazemos — Números"
            name: oQueFazemos
            widget: object
            fields:
              - { label: Título, name: title, widget: string }
              - label: Contadores
                name: stats
                widget: list
                fields:
                  - { label: Valor, name: target, widget: number }
                  - { label: Prefixo, name: prefix, widget: string, required: false }
                  - { label: Sufixo, name: suffix, widget: string, required: false }
                  - { label: Rótulo, name: label, widget: string }
          - label: "Portfólio (destaques)"
            name: portfolio
            widget: object
            fields:
              - { label: Título, name: title, widget: string }
              - { label: Subtítulo, name: lead, widget: string }
              - { label: Texto do botão, name: botao, widget: string }
              - label: Cards
                name: cards
                widget: list
                fields:
                  - { label: Título, name: title, widget: string }
                  - { label: Legenda, name: meta, widget: string }
                  - { label: "Texto CTA", name: cta, widget: string, required: false }
          - label: "Equipa"
            name: equipa
            widget: object
            fields:
              - { label: Título, name: title, widget: string }
              - label: Membros
                name: members
                widget: list
                fields:
                  - { label: Função, name: role, widget: string }
                  - { label: Nome, name: name, widget: string }
                  - { label: Bio, name: bio, widget: text }
  - name: portfolio
    label: "Página Portfólio"
    files:
      - name: portfolio
        label: "Projetos"
        file: "src/data/portfolio.json"
        fields:
          - label: Projetos
            name: projetos
            widget: list
            fields:
              - { label: Nome, name: nome, widget: string }
              - { label: Localização, name: localizacao, widget: string }
              - { label: Tipologia, name: tipologia, widget: string }
              - { label: Descrição, name: descricao, widget: text, required: false }
              - { label: Foto, name: foto, widget: image, required: false }
```

> Nota: ajustar os campos de `config.yml` para casar exatamente com as chaves
> finais dos JSON criados nas Tasks 3-5 (incluir `sobre.json` da mesma forma).

- [ ] **Step 3: Instalar o proxy de modo local**

```bash
npm install --save-dev @sveltia/cms-proxy-server
```

- [ ] **Step 4: Rodar proxy + dev e testar o painel**

Em um terminal: `npx sveltia-cms-proxy-server`
Em outro: `npm run dev`
Abrir `http://localhost:4321/admin/`, escolher "Work with Local Repository".
Expected: o painel lista "Página Início", "Página Portfólio"; abrir um card e editar um texto salva no JSON correspondente.

- [ ] **Step 5: Confirmar que a edição reflete no site**

Editar um título pelo painel, salvar, recarregar `http://localhost:4321`.
Expected: o texto novo aparece no site.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Sveltia CMS admin panel with local backend"
```

---

### Task 7: Cloudflare Web Analytics (snippet)

**Files:**
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: token do Cloudflare (placeholder na demo).
- Produces: snippet de analytics carregado em todas as páginas.

- [ ] **Step 1: Adicionar o snippet antes de `</body>` no `Base.astro`**

```astro
<!-- Cloudflare Web Analytics — substituir TOKEN ao publicar -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
  data-cf-beacon='{"token": "TOKEN_DO_CLOUDFLARE"}'></script>
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: build sem erro; o snippet aparece no HTML de `dist/`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Cloudflare Web Analytics snippet (token placeholder)"
```

---

### Task 8: Documentação (guia do cliente + publicação)

**Files:**
- Create: `docs/GUIA-CLIENTE.md`
- Create: `docs/PUBLICACAO.md`

**Interfaces:**
- Produces: guia em português de "como editar" e o passo a passo de publicação (GitHub + Cloudflare Pages + OAuth + ativar Analytics).

- [ ] **Step 1: Escrever `docs/GUIA-CLIENTE.md`**

Conteúdo: como entrar no `/admin`, editar foto/texto, **adicionar um card** (projeto/serviço/membro), salvar e publicar. Linguagem simples, com a lógica "item vs. tipo de seção".

- [ ] **Step 2: Escrever `docs/PUBLICACAO.md`**

Passo a passo dos 20% humanos: criar repo no GitHub, conectar Cloudflare Pages (build `npm run build`, saída `dist`), criar o OAuth worker para o login do Sveltia, trocar `repo:` no `config.yml`, ativar Cloudflare Web Analytics e colar o token no `Base.astro`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: client editing guide and publishing instructions"
```

---

## Self-Review

- **Spec coverage:** Objetivo (editar fotos/textos/cards) → Tasks 3-6. Listas repetíveis (portfólio/serviços/equipa/stats) → Tasks 3-6 widgets `list`. Visual livre/idêntico → Constraint + steps de paridade. Analytics → Task 7. Login GitHub + modo local → Task 6. Guia cliente + publicação → Task 8. Sem lacunas.
- **Placeholders:** `TOKEN_DO_CLOUDFLARE` e `SEU_USUARIO/empresa-bela` são valores reais a preencher na publicação (documentados na Task 8), não pendências de plano.
- **Type consistency:** chaves dos JSON (`oQueFazemos.stats`, `portfolio.cards`, `equipa.members`, `projetos`) são reusadas de forma idêntica entre data files, componentes e `config.yml`.
