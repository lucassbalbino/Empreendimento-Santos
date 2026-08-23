# SEO — plano, implementação e manutenção

> Documento de trabalho do SEO do site AM Santos.
> Data da implementação: **23 de agosto de 2026**.
> Estado: base técnica completa e testada. As pendências estão na secção 5.

---

## 1. Ponto de partida

O site tinha zero SEO. Não é exagero — é o inventário:

| O que faltava | Consequência |
|---|---|
| Títulos "Mockup — Início", "Mockup — Portfólio" | Era isso que apareceria no Google |
| Sem `canonical` | Cada página acessível por vários URLs a competir entre si |
| Sem `sitemap.xml` | O Google teria de descobrir as 17 fichas de empreendimento por acaso |
| Sem `robots.txt` | Sem instruções de rastreio, sem apontador para o sitemap |
| Sem dados estruturados (JSON-LD) | O Google via texto, não via uma empresa de construção com obras |
| `og:image` relativa | Partilhas no WhatsApp/LinkedIn sem imagem |
| Sem página 404 | Erros a devolver a página do alojamento, com risco de *soft 404* |
| 17 fichas com dois parágrafos de template | Páginas quase iguais a competir umas com as outras |
| 14,3 MB de imagens, originais de 5841 px | LCP de 7,3 s — e o LCP é fator de ranking |

---

## 2. Estratégia — o que funciona neste nicho

Pesquisa feita em agosto de 2026 (fontes no fim da secção). No imobiliário
português, o tráfego orgânico reparte-se por cinco alavancas, e não por uma:

**1. SEO local é a maior fatia.** Os sinais do Google Business Profile pesam
~32% no *Local Pack*. É o ativo de maior alavancagem e **não vive no site** —
vive na ficha de empresa do Google. Ver 5.1.

**2. Consistência de NAP** (Name, Address, Phone) entre o site, o Google
Business Profile e os diretórios. Um telefone diferente em dois sítios divide a
entidade aos olhos do Google. É por isso que o `seo.json` tem um interruptor
`nap.verificado` que mantém a morada FORA do JSON-LD enquanto for placeholder —
publicar um NAP falso agora obriga a limpá-lo depois em todo o lado.

**3. Dados estruturados.** Páginas com `schema.org` marcado rankeiam em média
quatro posições acima das que não têm. No imobiliário, o vocabulário certo é
`RealEstateListing` + o tipo de imóvel (`ApartmentComplex`,
`SingleFamilyResidence`, `Hotel`), não um `Article` genérico.

**4. Conteúdo hiperlocal bate conteúdo genérico.** "Empreendimentos novos em
Loures" ganha a "empreendimentos novos". A AM Santos tem 20 anos de obra
concentrada num concelho — é uma vantagem real que estava por explorar.

**5. Core Web Vitals são fator de ranking confirmado** (LCP, INP, CLS). E em
2026 há uma alavanca nova: uma fatia das pesquisas é respondida dentro de
assistentes de IA. Daí o `robots.txt` permitir explicitamente GPTBot, ClaudeBot
e PerplexityBot, e daí o conteúdo estar escrito em perguntas e respostas —
formato que as pesquisas conversacionais (média de 23 palavras) encontram.

**O que NÃO se fez, de propósito:** schema `FAQPage`. O Google deixou de
mostrar FAQ rich results em maio de 2026 e removeu o relatório em junho. O
conteúdo de perguntas e respostas continua a valer; a marcação já não.

*Fontes:* [Sierra Interactive — Real Estate SEO Guide 2026](https://www.sierrainteractive.com/insights/blog/real-estate-seo/) ·
[Local SEO for Real Estate 2026](https://bigboxstudio.in/local-seo-for-real-estate/) ·
[SEO Local para Imobiliárias](https://www.websiteimobiliario.com.br/blog/seo-local-para-imobiliarias.html) ·
[Marketing Digital Imobiliário Portugal 2026](https://rafa.pt/marketing-digital-imobiliario/) ·
[schema.org/RealEstateListing](https://schema.org/RealEstateListing) ·
[Google — Changes to HowTo and FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes) ·
[Search Engine Land — Google to no longer support FAQ rich results](https://searchengineland.com/google-to-no-longer-support-faq-rich-results-476957)

---

## 3. O que está implementado

### 3.1 Fonte única de verdade

**[`src/data/seo.json`](../src/data/seo.json)** — domínio, idioma, dados da
organização, NAP, redes sociais, token de analytics e o título/descrição de
cada página estática.

Mudar o domínio aqui propaga para canonical, sitemap, robots.txt, Open Graph e
JSON-LD. É o único sítio a tocar quando o domínio real for conhecido.

Dois interruptores importantes:

- `indexavel: true` → pôr a `false` fecha o site inteiro à indexação (útil
  enquanto for um mockup publicado num endereço temporário).
- `nap.verificado: false` → enquanto for `false`, a morada e o telefone **não
  entram no JSON-LD**. Pôr a `true` só quando forem reais.

### 3.2 Cabeça de SEO

**[`src/components/Seo.astro`](../src/components/Seo.astro)** — emite, por página:
título, descrição, `canonical` absoluta, `robots` com `max-image-preview:large`,
Open Graph completo com URLs absolutas, Twitter Card, `preload` da imagem de topo
e um único bloco JSON-LD.

As páginas estáticas **não passam nada** — o componente resolve pelo caminho
contra o `seo.json`. Só as rotas dinâmicas passam valores calculados.

Páginas `noindex` não levam `canonical`: uma 404 que se auto-canonicaliza para
um URL a fingir é um erro que o Google assinala.

### 3.3 Dados estruturados

**[`src/utils/schema.js`](../src/utils/schema.js)** — um `@graph` por página,
com nós globais de `@id` fixo referenciados em vez de repetidos:

| Nó | Onde |
|---|---|
| `Organization` + `HomeAndConstructionBusiness` | todas as páginas |
| `WebSite` | todas as páginas |
| `WebPage` / `CollectionPage` / `AboutPage` / `ContactPage` / `RealEstateListing` | conforme a página |
| `BreadcrumbList` | todas menos a home |
| `ApartmentComplex` / `SingleFamilyResidence` / `Hotel` / `Place` | fichas de empreendimento |
| `ItemList` | portfólio, histórico, home |
| `Person` (equipa) | /equipa |
| `Blog` + `BlogPosting` | /blog |

O tipo do imóvel é escolhido pelos dados
([`tipoDeImovel`](../src/utils/schema.js)): um centro logístico e um hotel não
são residências, e marcá-los como tal seria marcação errada.

### 3.4 Rastreio e indexação

- **[`src/pages/robots.txt.js`](../src/pages/robots.txt.js)** — gerado no build,
  sempre sincronizado com o domínio. Bloqueia `/admin/`, permite explicitamente
  os crawlers de IA, aponta para o sitemap.
- **Sitemap** — `@astrojs/sitemap` em [`astro.config.mjs`](../astro.config.mjs),
  com prioridades por tipo de página e barra final normalizada (para o sitemap e
  a canonical não apontarem para URLs diferentes). A 404 fica de fora.
- **[`src/pages/404.astro`](../src/pages/404.astro)** — `noindex`, fora do
  sitemap, mas com links para as páginas que interessam.

### 3.5 Fichas de empreendimento

O problema era 17 páginas com o mesmo texto. A solução está em
**[`src/utils/empreendimento-seo.js`](../src/utils/empreendimento-seo.js)**: todo
o texto é composto a partir dos campos reais do
`src/data/empreendimentos.json`. Não há sinónimos rodados a simular diferença —
a diferença vem de os empreendimentos serem mesmo diferentes.

Cada ficha ganhou:

- **título único** com tipologia e concelho, dentro dos 62 caracteres, sem
  repetir palavras que o nome já diz;
- **descrição única** de 120–158 caracteres com unidades, tipologia,
  localização, fase e situação comercial;
- **migalhas visíveis** (Início › Portfólio/Histórico › Nome) + `BreadcrumbList`;
- **cinco perguntas e respostas** derivadas dos dados do projeto;
- **schema do imóvel** com morada, número de unidades e ficha técnica.

> ⚠️ **Cuidado com o campo `grupo`.** `grupo: "concluido"` significa *"aparece
> no histórico"*, **não** *"obra terminada"* — há três empreendimentos nesse
> grupo cujo `estado` é "Em projeto" ou "Em construção". Uma primeira versão
> deste código derivava a frase do `grupo` e escrevia "Concluído em 2023" na
> descrição de um projeto em fase de projeto. O texto lê agora `entrega` e
> `estado`, que são os campos autoritativos.

### 3.6 Blog

Coleção de conteúdo Astro em `src/content/blog/` (Markdown), com
[`config.ts`](../src/content/config.ts) a validar o frontmatter, páginas em
[`src/pages/blog/`](../src/pages/blog/) e uma coleção de pasta no Sveltia CMS
para o cliente escrever sem tocar em código.

Três artigos de arranque, a atacar pesquisas reais do nicho:

| Artigo | Pesquisa-alvo |
|---|---|
| Comprar casa em planta: o que verificar | "comprar casa em planta" |
| Certificado energético: o que muda na fatura | "certificado energético classe A" |
| Viver em Loures: o que procurar num empreendimento novo | "empreendimentos novos Loures" |

> ⚠️ **Os três artigos são um ponto de partida, não conteúdo aprovado.** Devem
> ser lidos e personalizados pelo cliente antes de valerem como voz da empresa —
> é aí que o E-E-A-T se ganha. O campo `rascunho: true` mantém um artigo fora do
> site e do sitemap enquanto não estiver pronto.

### 3.7 Desempenho (Core Web Vitals)

| Intervenção | Ficheiro | Ganho medido |
|---|---|---|
| Fontes servidas do próprio domínio, com `preload` | [`scripts/fontes-descarregar.mjs`](../scripts/fontes-descarregar.mjs) | **FCP 2,9 s → 1,2 s** |
| Imagens redimensionadas e convertidas para WebP | [`scripts/imagens-otimizar.mjs`](../scripts/imagens-otimizar.mjs) | **14,3 MB → 4,1 MB (−71%)** |
| `styles.css` e `main.js` minificados na saída | [`scripts/postbuild-assets.mjs`](../scripts/postbuild-assets.mjs) | 168 KB → 70 KB |
| `preload` da imagem de topo de cada página | `Seo.astro` | descoberta antecipada do elemento LCP |
| Beacon do Cloudflare só com token real | `Base.astro` | um pedido falhado a menos por página |
| `width`/`height` nos logótipos | `Header.astro`, `Footer.astro` | espaço reservado antes de carregar |

---

## 4. Como testar

```bash
npm run seo            # build + auditoria completa
npm run seo:check      # só a auditoria (assume dist/ já construído)
npm run imagens:auditar    # inventário de peso das imagens
npm run imagens:otimizar   # simulação; --aplicar para escrever
```

A auditoria ([`scripts/seo-check.mjs`](../scripts/seo-check.mjs)) corre sobre o
**HTML final**, não sobre o código-fonte — é o HTML final que o Google vê. São
**758 verificações** em 28 páginas:

- título único, presente, 25–65 caracteres
- descrição única, presente, 70–165 caracteres
- `canonical` única, absoluta e a apontar para a própria rota
- `robots`, `viewport` e `<html lang>` presentes
- exatamente um `<h1>` por página, com texto
- Open Graph completo, com `og:image` absoluta
- todo o JSON-LD faz *parse* e tem `@context` e `@type`
- todas as `<img>` têm `alt`
- nenhuma ligação interna sem destino
- nenhuma imagem a apontar para ficheiro inexistente
- toda a página indexável está no sitemap, e nenhuma `noindex` lá está
- `robots.txt` aponta para o sitemap do domínio configurado
- nenhum vocabulário de mockup em títulos ou descrições

Sai com código 1 se houver falhas — serve para bloquear um deploy em CI.

**Estado atual: 758 verificações, 0 falhas, 2 avisos** (os dois avisos são as
pendências de configuração da secção 5.1).

### Validação manual, depois de publicar

O que uma auditoria local não consegue verificar:

1. [Rich Results Test](https://search.google.com/test/rich-results) — confirmar o JSON-LD contra o validador do Google.
2. [PageSpeed Insights](https://pagespeed.web.dev/) — dá dados de campo (CrUX) reais, que o Lighthouse local não tem.
3. **Google Search Console** — submeter o sitemap e vigiar a cobertura.

---

## 5. O que falta

### 5.1 Só o cliente pode fazer — por ordem de impacto

1. **Google Business Profile.** ~32% do peso do *Local Pack*. Criar, verificar a
   morada, escolher a categoria ("Empresa de construção" / "Promotor
   imobiliário"), pôr fotografias reais de obras, publicar com regularidade e
   pedir avaliações a clientes. **É a ação de maior retorno de toda esta lista** e
   não depende de uma linha de código.
2. **Dados reais de NAP.** Morada, telefone e e-mail verdadeiros em
   `src/data/seo.json` e `src/data/contactos.json`, e `nap.verificado: true`.
   Enquanto não acontecer, a morada não entra no JSON-LD.
3. **Perfis em `organizacao.sameAs`.** URLs do Google Business Profile,
   LinkedIn, Instagram e Facebook. É o que liga a marca à entidade no Knowledge
   Graph. Os ícones do rodapé apontam hoje para `#`.
4. **Domínio real** em `seo.json > dominio`.
5. **Ligações de entrada.** Associações do setor, imprensa local, portais
   (Idealista, Imovirtual, Casa Sapo), câmara municipal, fornecedores. É o fator
   externo que o site sozinho não produz.
6. **Rever e personalizar os três artigos**, e manter um ritmo de publicação.

### 5.2 Decisões técnicas em aberto

**LCP da home: 6,3 s.** É a única métrica ainda em vermelho e tem duas causas
medidas, ambas ligadas à identidade visual do site — por isso ficam aqui como
decisão e não como alteração já feita:

| Causa | Custo medido | O que se ganharia |
|---|---|---|
| Preloader (contador 0–100, `RAMP` de 2400 ms) | ~14 pontos de performance | LCP 6,3 s → 5,9 s, TBT 340 → 320 ms |
| Pilha de animação (split-type + Lenis + observers) | 2,8 s de *styleLayout*, 2,7 s de execução de script | o grosso do que resta |

Opções, da menos à mais invasiva:

1. **Baixar o `RAMP` do preloader** de 2400 ms para ~1200 ms. Mantém o efeito,
   corta-o a meio. Uma linha em `Base.astro`.
2. **Correr o split-text só nos títulos acima da dobra** na primeira pintura, e
   os restantes ao entrar em vista. Mantém o efeito inteiro, adia o trabalho.
3. **Desligar o preloader na home** e mantê-lo nas navegações internas.

Para contexto: as outras páginas já estão bem — **/blog em 90** e **ficha de
empreendimento em 73**. O problema está concentrado na home, que é também a
página com mais animação.

**Multilingue.** O EN/FR é traduzido no browser (localStorage + `fetch` de
`/i18n/*.json`). O Google não indexa essas versões: existe uma só página, em
português, por URL. Foi decisão consciente focar o mercado português primeiro.
Para captar procura estrangeira seria preciso rotas reais `/en/` e `/fr/` com
`hreflang` — refactor de routing que toca em todas as páginas.

Nota: os blocos novos (perguntas frequentes das fichas, blog, 404, migalhas)
não passam pelo dicionário de i18n e ficam em português em qualquer idioma.

**Acessibilidade (83–88).** Fora do âmbito deste trabalho, mas medido e
registado: `<select>` do formulário sem nome acessível, `<h4>` do rodapé a
quebrar a ordem de cabeçalhos, alvos de toque pequenos, e contraste insuficiente
em `.fact__r` na secção escura da ficha de empreendimento.

---

## 6. Medições

Lighthouse, perfil móvel, sobre `astro preview` local. Os números de campo reais
só existirão depois de publicar (PageSpeed Insights / CrUX).

| Página | Performance | SEO | Boas práticas | FCP | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|---|---|
| **Home — antes** | 44 | 100 | 96 | 2,9 s | 7,3 s | 950 ms | 0 | 2686 KiB |
| **Home — depois** | **65** | **100** | **100** | **1,2 s** | 6,3 s | 340 ms | 0 | **1631 KiB** |
| Ficha de empreendimento | 73 | 100 | 100 | 1,4 s | 5,0 s | 240 ms | 0 | 1138 KiB |
| Artigo do blog | 90 | 100 | 100 | 1,3 s | 3,5 s | 110 ms | 0 | 426 KiB |

---

## 7. Manutenção

**Novo empreendimento** → acrescentar ao `src/data/empreendimentos.json` (ou
pelo CMS). Título, descrição, perguntas, schema, sitemap e migalhas são gerados
sozinhos. Correr `npm run seo` para confirmar.

**Novo artigo** → painel do CMS, coleção "Blog". Nasce com `rascunho: true`;
desligar quando estiver pronto. O endereço vem do nome do ficheiro e **não deve
mudar depois de publicado**.

**Novas imagens** → `npm run imagens:auditar` para ver o peso, `npm run
imagens:otimizar -- --aplicar` para corrigir. Se alguma mudar de extensão,
atualizar as referências e correr `npm run seo` — a auditoria apanha as que
ficarem para trás.

**Mudar o domínio** → uma linha em `src/data/seo.json`.

**Atualizar as fontes** → `node scripts/fontes-descarregar.mjs` reescreve os
`.woff2` e o bloco de `@font-face` no topo do `public/styles.css`, entre os
marcadores `@fontes:inicio` / `@fontes:fim`.
