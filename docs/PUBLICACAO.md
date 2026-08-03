# Publicação — colocar o site no ar e ativar a edição

Este documento cobre os **~20% de passos humanos** (criar contas e fazer login).
Todo o código já está pronto. Tempo estimado: 30–60 min na primeira vez.

---

## 0. Rodar localmente (demonstração, sem nenhuma conta)

Para ver o site e o painel funcionando no seu computador:

```bash
npm install
npm run dev        # site em http://localhost:4321
# em OUTRO terminal:
npm run cms-proxy  # backend local do painel (porta 8081)
```

Abra **`http://localhost:4321`** (site) e
**`http://localhost:4321/admin/index.html`** (painel). No painel, escolha
**"Work with Local Repository"**. As edições gravam direto nos arquivos
`src/data/*.json`.

> Observação: em produção o endereço do painel é só `/admin` (o `/index.html`
> é necessário apenas no servidor de desenvolvimento).

---

## 1. Código no GitHub — feito

Repositório: <https://github.com/lucassbalbino/Empreendimento-Santos> (branch
`main`). O `repo:` em `public/admin/config.yml` já aponta para ele.

## 2. Publicar na Cloudflare Pages

**Estado atual:** existe um projeto `empreendimento-santos` na Cloudflare Pages
(`empreendimento-santos.pages.dev`), mas foi criado via `wrangler pages deploy`
(CLI), **sem** ligação ao Git — ou seja, cada atualização exige rodar
`npm run build && npx wrangler pages deploy dist --project-name=empreendimento-santos`
manualmente.

Para automatizar (republica sozinho a cada push):

1. Dashboard da Cloudflare → **Workers & Pages → empreendimento-santos → Settings
   → Builds → Connect to Git** (ou recriar o projeto via **Create → Pages →
   Connect to Git**, se a opção de conectar um projeto já existente não estiver
   disponível).
2. Selecionar o repositório `lucassbalbino/Empreendimento-Santos`, branch `main`.
3. Configurações de build:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy.**

A partir daqui, todo push no GitHub republica o site automaticamente — e é isso
que o painel faz quando o cliente clica em "Publicar".

## 3. Login do cliente no painel (OAuth do GitHub)

O Sveltia precisa de um "porteiro" OAuth para o login. O jeito mais simples é o
worker oficial da Cloudflare, `sveltia-cms-auth`.

**Estado atual:** o `public/admin/config.yml` já aponta para o repositório real
(`lucassbalbino/Empreendimento-Santos`) e para o worker publicado. Faltam só os
passos 3.2 e 3.3 abaixo (criar o OAuth App e configurar os secrets).

### 3.1 Deploy do worker — feito

Worker publicado em <https://sveltia-cms-auth.lucascharlesbalbino.workers.dev>
(código de <https://github.com/sveltia/sveltia-cms-auth>).

### 3.2 Criar o GitHub OAuth App (manual)

Em <https://github.com/settings/developers> → **OAuth Apps → New OAuth App**:

- **Homepage URL:** `https://empreendimento-santos.pages.dev`
- **Authorization callback URL:** `https://sveltia-cms-auth.lucascharlesbalbino.workers.dev/callback`
- Anotar o **Client ID** e gerar um **Client Secret**.

### 3.3 Configurar os secrets do worker (manual, recomendado pelo dashboard)

No dashboard da Cloudflare → Workers & Pages → `sveltia-cms-auth` → Settings →
Variables → adicionar (usando o botão **Encrypt** para o secret):

- `GITHUB_CLIENT_ID`: o Client ID do passo 3.2
- `GITHUB_CLIENT_SECRET`: o Client Secret do passo 3.2 (encriptado)

Alternativa via terminal (o secret fica no histórico do shell, por isso o
dashboard é mais seguro):

```bash
npx wrangler secret put GITHUB_CLIENT_ID --name sveltia-cms-auth
npx wrangler secret put GITHUB_CLIENT_SECRET --name sveltia-cms-auth
```

Pronto: o cliente acessa `empreendimento-santos.pages.dev/admin`, clica em
**Login**, autoriza pelo GitHub uma única vez, e passa a editar.

## 4. Ativar o Cloudflare Web Analytics

1. No painel da Cloudflare: **Analytics & Logs → Web Analytics → Add a site**.
2. Informe o domínio do site.
3. Copie o **token** gerado.
4. No arquivo **`src/layouts/Base.astro`**, troque `TOKEN_DO_CLOUDFLARE` pelo
   token real. Commit + push.

As métricas (visitas, páginas mais vistas, origem do tráfego) aparecem no painel
da Cloudflare, sem cookies e sem aviso de LGPD.

---

## Checklist final

- [ ] Código no GitHub (`git push`)
- [ ] `repo:` ajustado no `config.yml`
- [ ] Site publicado na Cloudflare Pages (build `npm run build`, saída `dist`)
- [ ] Worker de OAuth criado e `base_url` no `config.yml`
- [ ] Token do Cloudflare Analytics colado no `Base.astro`
- [ ] Cliente consegue entrar em `/admin` e editar
