# Design — Site editável pelo cliente (Git-based CMS) + Analytics

> Documento de design do projeto "Empresa Bela". Serve tanto como guia de
> implementação quanto como material para apresentar ao cliente.
> Data: 2026-06-29.

---

## 1. Objetivo

Transformar o site (hoje estático) em um site que o **cliente edita sozinho**,
por um painel web simples, sem tocar em código:

- Trocar **fotos** e **textos** de todas as seções.
- **Adicionar / remover / reordenar cards** em listas (projetos do portfólio,
  serviços, equipa, contadores).
- Ter **análise de visitantes** (quantas visitas, páginas mais vistas, origem
  do tráfego).

Tudo isso mantendo o **visual atual 100% livre** — o CMS se molda ao design, e
não o contrário.

## 2. Princípio central: conteúdo separado do design

Hoje os textos e as imagens estão "chumbados" dentro do HTML. O projeto separa:

- **Design** (HTML/CSS/JS) → continua sendo nosso, sem amarras de plataforma.
- **Conteúdo** (textos, fotos, lista de projetos) → vai para arquivos editáveis,
  controlados pelo painel.

Consequência prática:

| Tipo de mudança | Quem faz | Esforço |
|---|---|---|
| Editar foto/texto de uma seção | Cliente, no painel | Segundos |
| Adicionar um **card** a uma lista existente (apartamento, serviço, membro) | Cliente, no painel | Segundos |
| Criar um **tipo de seção novo** (ex.: "Depoimentos") | Desenvolvedor | Moderado |
| Mudar o visual/layout | Desenvolvedor (só CSS) | Sem risco ao conteúdo |

## 3. Arquitetura (a "pilha")

| Camada | Escolha | Por quê |
|---|---|---|
| Gerador do site | **Astro** | Converte o mockup em "orientado a dados" mantendo o visual idêntico. Gera HTML estático rápido. |
| Painel de edição | **Sveltia CMS** (`/admin`) | Git-based, interface moderna, grátis. |
| Conteúdo | Arquivos **Markdown/JSON** no repositório (Git) | Versionado, com histórico e "desfazer". |
| Hospedagem | **Cloudflare Pages** | Grátis, deploy automático a cada edição, CDN rápido. |
| Analytics | **Cloudflare Web Analytics** | Grátis, sem cookies, sem complicação de LGPD. |

**Fluxo de edição do cliente:**
`seudominio.com/admin` → login → edita foto/texto/projeto → salvar →
Cloudflare reconstrói o site → no ar em ~1 minuto.

## 4. Login do cliente

O Sveltia (Git-based) autentica pela conta do provedor Git.
- O cliente usa um login **GitHub gratuito**, com acesso só ao repositório do site.
- Um pequeno "OAuth worker" na Cloudflare cuida do login.
- O cliente vê só um botão **"Login"** e o painel — não precisa entender Git.

> Para a **demonstração local**, nem isso é necessário: o Sveltia roda em modo
> local e o painel funciona direto no computador.

## 5. Modelo de conteúdo (o que vira editável)

Cada seção do site vira campos no painel. Listas marcadas com 🔁 são
**repetíveis** (o cliente adiciona/remove/reordena cards).

- **Hero** (3 páginas): imagem de fundo, título, subtítulo, texto do botão.
- **Quem Somos / Track Record**: títulos, textos, imagens.
- **Números (stats)** 🔁: rótulo + valor-alvo de cada contador.
- **O Que Fazemos / Serviços** 🔁: cada serviço com título, texto, imagem.
- **Portfólio** 🔁: cada projeto com nome, localização, tipologia, foto(s),
  descrição.
- **Equipa** 🔁: cada membro com foto, nome, função.
- **Imagens**: upload pelo próprio painel (vão para uma pasta de mídia).

## 6. Analytics

**Cloudflare Web Analytics** — grátis, sem cookies, zero manutenção.
Métricas: visitas, páginas/projetos mais vistos, origem do tráfego.
(Se no futuro o cliente quiser campanhas/conversões de anúncios, adiciona-se o
Google Analytics 4 em paralelo.)

## 7. Fora de escopo agora (YAGNI)

- Edição de rótulos do menu e dados de contato (fácil de adicionar depois).
- CRM de leads do formulário de contato (peça separada).
- Criação de *tipos* de seção novos pelo cliente (continua sendo trabalho de dev).

## 8. Divisão de trabalho (automação com Claude)

- **~80% automatizável** (código, config, conteúdo, testes, docs) → feito pelo Claude.
- **~20% humano** (criar contas GitHub/Cloudflare, login, 2FA, apontar domínio)
  → feito pelo dono, com instruções exatas.

A divisória não é "fácil vs. difícil" — é "o que tem senha/conta atrás".

## 9. Esforço

Setup único de **~2 a 4 dias** de trabalho efetivo para um desenvolvedor.
Depois no ar: manutenção quase nula; edições do dia a dia são do cliente, sem
custo de desenvolvimento. Custo de infraestrutura ≈ R$ 0.

## 10. Entregáveis

1. Site migrado para Astro (mesmo visual, mesmo CSS).
2. Conteúdo extraído para arquivos editáveis.
3. Painel `/admin` (Sveltia) configurado, rodando localmente para demonstração.
4. Snippet do Cloudflare Web Analytics pronto para ativar.
5. Guia curto "como editar o site" para o cliente.
6. Instruções de publicação (GitHub + Cloudflare + OAuth) para o passo final.
