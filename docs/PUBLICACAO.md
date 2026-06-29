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

## 1. Subir o código para o GitHub

1. Crie uma conta gratuita em <https://github.com> (se ainda não tiver).
2. Crie um repositório novo, ex.: **`empresa-bela`** (pode ser privado).
3. No terminal, dentro da pasta do projeto:

```bash
git remote add origin https://github.com/SEU_USUARIO/empresa-bela.git
git branch -M main
git push -u origin main
```

4. No arquivo **`public/admin/config.yml`**, troque a linha
   `repo: SEU_USUARIO/empresa-bela` pelo seu usuário/repositório reais e
   faça commit + push.

## 2. Publicar na Cloudflare Pages

1. Crie conta gratuita em <https://dash.cloudflare.com>.
2. **Workers & Pages → Create → Pages → Connect to Git** e selecione o repositório.
3. Configurações de build:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy.** Em ~1 min o site fica no ar num endereço `*.pages.dev`.
5. (Opcional) Aponte seu domínio próprio em **Custom domains**.

A partir daqui, todo push no GitHub republica o site automaticamente — e é isso
que o painel faz quando o cliente clica em "Publicar".

## 3. Login do cliente no painel (OAuth do GitHub)

O Sveltia precisa de um "porteiro" OAuth para o login. O jeito mais simples é o
worker oficial da Cloudflare:

1. Em <https://github.com/settings/developers> → **OAuth Apps → New OAuth App**:
   - **Homepage URL:** o endereço do seu site (ex.: `https://empresa-bela.pages.dev`)
   - **Authorization callback URL:** `https://<seu-worker>.workers.dev/callback`
     (preencha depois de criar o worker, no passo seguinte)
   - Anote o **Client ID** e gere um **Client Secret**.
2. Crie o worker de OAuth (Sveltia recomenda o
   **`sveltia-cms-auth`** — instruções em
   <https://github.com/sveltia/sveltia-cms-auth>):
   - Faça o deploy do worker na sua conta Cloudflare.
   - Configure as variáveis `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`.
   - Copie a URL do worker e cole no **callback URL** do passo 1.
3. No `public/admin/config.yml`, aponte o backend para o worker, ex.:

```yaml
backend:
  name: github
  repo: SEU_USUARIO/empresa-bela
  branch: main
  base_url: https://<seu-worker>.workers.dev
```

4. (Opcional, mais simples) Em vez do OAuth próprio, dá para usar **Cloudflare
   Access** ou hospedar via Netlify com Git Gateway. Para a maioria dos casos,
   o `sveltia-cms-auth` é o caminho recomendado.

Pronto: o cliente acessa `seusite.com/admin`, clica em **Login**, autoriza pelo
GitHub uma única vez, e passa a editar.

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
