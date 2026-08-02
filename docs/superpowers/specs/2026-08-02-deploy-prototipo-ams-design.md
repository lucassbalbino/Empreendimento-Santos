# Deploy do protótipo AMS para teste dos clientes — design

**Data:** 2026-08-02
**Estado:** aprovado, execução em espera (sessão paralela aberta no mesmo branch)

---

## 1. Objetivo

Colocar o site no ar num endereço `*.pages.dev` da Cloudflare Pages, público mas
não indexável, com o painel `/admin` (Sveltia CMS) funcional em produção, para os
clientes navegarem, testarem em telemóvel, editarem conteúdo e darem feedback.

Antes disso, eliminar o nome de trabalho "Empresa Bela" do projeto, substituindo-o
por "AMS".

## 2. Decisões tomadas

| Questão | Decisão |
|---|---|
| Âmbito do teste | Ver **e** editar conteúdo |
| Login dos clientes no painel | Conta GitHub **partilhada** (mantém-se o Sveltia CMS) |
| Autenticação em produção | Worker `sveltia-cms-auth` na Cloudflare + OAuth App do GitHub |
| Exposição do site | Link público, **não indexado** (`robots.txt` + meta `noindex`) |
| Formulário de contacto | Fica **inerte**, como está — documentado como limitação conhecida |
| Nome | `AMS` literalmente em todas as ocorrências |
| Pasta do projeto no disco | **Não** renomear |
| Registos históricos (diffs, specs antigos) | Também mudam para AMS |

### Alternativas descartadas

- **DecapBridge / Keystatic Cloud** (login por e-mail sem conta GitHub): descartados
  a favor da conta partilhada, que não exige migração de painel nem serviço extra.
- **CMS headless (Sanity, Directus)**: tirariam o conteúdo do repo e obrigariam a
  reescrever todo o carregamento de dados nas páginas. Fora de âmbito para um protótipo.
- **Cloudflare Access** (só e-mails autorizados): descartado por acrescentar um passo
  de login em cada dispositivo do cliente.

### Risco aceite

Reescrever `.superpowers/sdd/*.diff` e os specs/planos datados faz com que deixem de
corresponder literalmente aos commits que documentam. O utilizador escolheu esta opção
com o custo explicitado: prioridade é não sobrar nenhuma menção a "Empresa Bela" no repo.

---

## 3. Fase 0 — Renomear Empresa Bela → AMS

Substituir `Empresa Bela` → `AMS`, `empresa-bela` / `empresabela` → `ams`.
São 18 ficheiros; nenhum ficheiro tem "bela" no nome, todas as ocorrências são
de conteúdo.

### 3.1 Código e configuração

| Ficheiro | Alteração |
|---|---|
| `package.json` | `"name": "ams"`, `"description": "Site AMS — Astro + Sveltia CMS"` |
| `package-lock.json` | os dois campos `"name": "empresa-bela"` (linhas 2 e 8) |
| `astro.config.mjs` | comentário do cabeçalho |
| `public/styles.css` | comentário do cabeçalho (linha 2) |
| `public/admin/index.html` | `<title>Editar o site — AMS</title>` — **única ocorrência visível ao cliente** |
| `public/admin/config.yml` | linha `repo:` (ver Fase 1, onde recebe o valor real) |

### 3.2 Documentação viva

`CONTEXTO.md`, `docs/APRENDER-PASSO-A-PASSO.md`, `docs/PUBLICACAO.md`,
`referencias/README.md`.

### 3.3 Registos históricos

`.superpowers/sdd/review-56d8be4..3913818.diff`,
`.superpowers/sdd/review-71aa258..3917fe6.diff`,
`.superpowers/sdd/review-71aa258..9a81400.diff`,
`.superpowers/sdd/review-split-text-feature.diff`,
`.superpowers/sdd/task-4-report.md`,
`docs/superpowers/plans/2026-06-29-site-editavel-cms.md`,
`docs/superpowers/plans/2026-07-22-transicao-cortina-hero.md`,
`docs/superpowers/specs/2026-06-29-site-editavel-cms-design.md`,
`docs/superpowers/specs/2026-07-08-paginas-institucionais-design.md`.

### 3.4 Exceção explícita

`.claude/settings.local.json` **não muda**. As ocorrências ali são caminhos absolutos
para a pasta real no disco (`C:\Users\lcbty\Claude\Projects\Empresa Bela\`), que não é
renomeada. Alterá-los partiria as regras de permissões.

### 3.5 Verificação da Fase 0

```bash
grep -rniI "empresa.bela\|empresabela" --exclude-dir=node_modules \
  --exclude-dir=.git --exclude-dir=dist --exclude-dir=.astro \
  --exclude=2026-08-02-deploy-prototipo-ams-design.md .
```

Só deve devolver linhas de `.claude/settings.local.json`. E `npm run build` continua
a terminar com exit 0 e 23 páginas.

Este spec está excluído da verificação de propósito: documenta a própria substituição,
por isso tem de nomear o termo antigo e o caminho real da pasta no disco.

---

## 4. Fase 1 — Alterações de código para o deploy

### 4.1 `astro.config.mjs` — definir `site`

Acrescentar `site: 'https://ams-site.pages.dev'` à config. Sem `site` definido, o
`og:image` do `Base.astro` fica relativo e a pré-visualização do link no WhatsApp,
Slack ou e-mail não aparece — que é exatamente como o protótipo vai ser partilhado.

O valor depende do nome do projeto criado na Cloudflare Pages. **O nome do projeto
Pages será `ams-site`**, dando `https://ams-site.pages.dev`. Se a Cloudflare recusar
esse nome por já estar tomado, o valor real substitui este em `astro.config.mjs`
antes do push final.

### 4.2 `src/layouts/Base.astro` — noindex e og:image absoluto

- Acrescentar `<meta name="robots" content="noindex, nofollow">` ao `<head>`.
- Tornar o `og:image` absoluto, resolvendo-o contra `Astro.site`.

**Nota para o futuro:** o `noindex` tem de ser removido quando o site deixar de ser
protótipo e for para produção a sério. Fica registado em `docs/TESTE-CLIENTE.md`.

### 4.3 `public/robots.txt` (novo)

```
User-agent: *
Disallow: /
```

Segunda barreira contra indexação, independente do meta tag.

### 4.4 `src/pages/404.astro` (novo)

Página 404 usando o `Base.astro` e a linguagem visual do site: título, uma linha de
texto e um link de volta ao início. Hoje um URL errado mostra a página de erro crua
da Cloudflare, que num teste de cliente parece um site partido.

### 4.5 `public/admin/config.yml` — backend real

```yaml
backend:
  name: github
  repo: lucassbalbino/Empreendimento-Santos
  branch: main
  base_url: https://<worker>.workers.dev   # URL do worker sveltia-cms-auth

local_backend: true
```

`local_backend: true` mantém-se: o Sveltia só o honra em `localhost`, por isso não
afeta produção e preserva o fluxo de desenvolvimento com `npm run cms-proxy`.

### 4.6 `public/fonts/` — commitar

**Crítico.** A pasta está untracked (52 KB). Sem ela no repo, a build da Cloudflare
não tem as fontes e a tipografia do site cai para fallbacks em produção.

### 4.7 `docs/PUBLICACAO.md` — valores reais

Substituir os placeholders (`SEU_USUARIO/empresa-bela`, `<seu-worker>`) pelos valores
reais, para o utilizador conseguir repetir ou corrigir o processo sozinho.

### 4.8 `docs/TESTE-CLIENTE.md` (novo)

Guia curto para enviar aos clientes junto com o link:

- o que testar (navegar, telemóvel, editar no `/admin`);
- o que ainda é placeholder (nomes de empreendimentos, pessoas, moradas, contactos,
  imagens) — ver a secção 3 do `CONTEXTO.md`;
- **o formulário de contacto não envia nada** — é intencional nesta fase;
- credenciais da conta partilhada e endereço do painel;
- como reportar feedback.

---

## 5. Fase 2 — Passos humanos (o utilizador executa)

Não são automatizáveis: exigem criar contas e aceitar permissões. O agente entrega
estes passos com os valores concretos já preenchidos.

1. **Confirmar a visibilidade do repo** `lucassbalbino/Empreendimento-Santos`. Se for
   público e o conteúdo do cliente não deve estar à vista, tornar privado — a
   Cloudflare Pages funciona igual com repos privados.
2. **Conta GitHub partilhada**: criar (ex. `edicao-amsantos`) e convidá-la como
   colaboradora com permissão de escrita no repo.
3. **OAuth App do GitHub** (`github.com/settings/developers`):
   - Homepage URL: `https://ams-site.pages.dev`
   - Authorization callback URL: `https://<worker>.workers.dev/callback`
   - Guardar Client ID e gerar Client Secret.
4. **Worker `sveltia-cms-auth`**: deploy na conta Cloudflare com as variáveis
   `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`. Copiar o URL do worker de volta para
   o callback do passo 3 e para o `base_url` do `config.yml`.
5. **Cloudflare Pages**: Workers & Pages → Create → Pages → Connect to Git → escolher
   o repo. Framework preset **Astro**, build command `npm run build`, output `dist`.

---

## 6. Ordem de execução

Sequencial — cada passo depende do anterior.

1. **Bloqueio:** esperar que a sessão paralela feche. Nada é commitado até lá.
2. Commit do WIP existente (~40 ficheiros) **incluindo `public/fonts/`**.
3. Fase 0 (renomear para AMS) + verificação + commit.
4. Fase 1 §4.1–4.4, 4.7, 4.8 (tudo o que não depende de URLs reais) + build + commit.
5. Push para `origin/main`.
6. Fase 2 passos 1–2 e 5: repo e Cloudflare Pages. O site fica no ar. Confirmar o URL
   `pages.dev` real.
7. Se o URL diferir de `ams-site.pages.dev`, corrigir `astro.config.mjs`.
8. Fase 2 passos 3–4: OAuth App e worker.
9. Fase 1 §4.5: `config.yml` com `repo` e `base_url` reais. Commit + push.
10. Verificação final (secção 7).

---

## 7. Verificação

**Antes do push**
- `npm run build` termina com exit 0 e 23 páginas.
- O grep da secção 3.5 só devolve `.claude/settings.local.json`.
- `git status` limpo, com `public/fonts/` já em versão.

**Depois do deploy**
- As 7 páginas de topo e pelo menos 3 páginas de empreendimento carregam sem erro.
- Fontes corretas em produção (comparar com o local, não fallback de sistema).
- Pré-visualização do link mostra imagem e título (testar em WhatsApp ou Slack).
- Um URL inexistente mostra o 404 do site, não o da Cloudflare.
- `https://ams-site.pages.dev/robots.txt` devolve o `Disallow: /`.
- Teste em telemóvel real.
- Login em `/admin` com a conta partilhada funciona; uma edição de teste grava no repo
  e a Cloudflare republica o site com a alteração visível.

---

## 8. Fora de âmbito

- Ligar o formulário de contacto a um serviço de envio (decisão explícita: fica inerte).
- Domínio próprio.
- Analytics.
- Substituir conteúdo e imagens placeholder por material real do cliente.
- Renomear a pasta do projeto no disco.
