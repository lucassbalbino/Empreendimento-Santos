# Pendências antes de publicar

> Levantamento feito a **23 de agosto de 2026**, no fim da implementação do
> consentimento de cookies. Cada linha foi verificada no código — não há aqui
> nada de memória nem de suposição, e cada item diz onde está e porque importa.
>
> Ordem: primeiro o que **impede** publicar, depois o que a degrada.

---

## 1. Bloqueadores — não publicar sem isto

### 1.1 Identificação legal da entidade está por confirmar

`src/data/seo.json > nap.verificado` é `false`. Enquanto for, a morada
(`Av. da Liberdade 120, 3º`) e o telefone (`+351 210 000 000`) são placeholder
e por isso **não entram** no JSON-LD nem nas páginas legais — está feito de
propósito, porque publicar um NAP falso contamina o Google Business Profile e os
diretórios, e num documento legal é pior do que uma lacuna.

Falta ainda o **NIPC**, que nenhum ficheiro tem hoje.

- **Onde:** `src/data/seo.json` (bloco `nap`), `src/data/site.json` (rodapé)
- **Quem decide:** cliente
- **Depois de preencher:** pôr `nap.verificado: true` e correr `npm run seo`

### 1.2 Textos legais por rever juridicamente

`/politica-de-cookies/` e `/politica-de-privacidade/` cobrem o que a CNPD exige
e estão escritas para serem percebidas, mas **não substituem validação
jurídica**. Ambas abrem com um aviso nesse sentido no código.

- **Onde:** `src/pages/politica-de-cookies.astro`, `src/pages/politica-de-privacidade.astro`
- **Quem decide:** quem responde legalmente pela AM Santos

### 1.3 O formulário de contacto não envia nada

`<form class="contact__form" onsubmit="return false">` — o formulário está
inerte. Quem o preencher e carregar em «Enviar mensagem» não envia coisa
nenhuma e não recebe erro nenhum. É a pior falha de todas as desta lista,
porque parece funcionar.

Escolher o destino (email direto, serviço de formulários tipo Formspree/Netlify
Forms, ou CRM). **Seja qual for, é um subcontratante** e tem de constar da
Política de Privacidade pelo nome, com contrato do artigo 28.º do RGPD.

- **Onde:** `src/components/ContactForm.astro:10`
- **Quem decide:** cliente escolhe o serviço; implementação é técnica

### 1.4 A newsletter também não está ligada

Campo de email e botão `→` no rodapé, sem destino nenhum. Mesmo problema e
mesma consequência legal (o subscritor dá consentimento para uma coisa que não
acontece).

- **Onde:** `src/components/Footer.astro:43-44`

### 1.5 Subcontratantes por nomear na Política de Privacidade

O texto refere «alojamento do site, serviço de email e, se aplicável,
plataforma de envio de newsletter» genericamente. A CNPD espera que sejam
**nomeados**. Só é possível depois de 1.3 e 1.4 estarem decididos.

- **Onde:** `src/pages/politica-de-privacidade.astro`, secção 5

---

## 2. Links que não vão a lado nenhum

Todos apontam para `href="#"`. Num site publicado, um link morto é pior do que
link nenhum: promete e falha.

| O quê | Onde |
|---|---|
| Instagram, Facebook, LinkedIn (rodapé) | `src/components/Footer.astro:12,19,24` |
| Telefone do rodapé | `src/components/Footer.astro:39` |
| Botões dos serviços em «Sobre nós» | `src/pages/sobre-nos.astro:100` |

O telefone deve passar a `tel:` assim que o número for real (ver 1.1). As redes
sociais, ou recebem URL, ou saem do rodapé — e nesse caso saem também de
`organizacao.sameAs`.

---

## 3. Conteúdo ainda por substituir

### 3.1 Fotografias dos empreendimentos

**15 dos 17** empreendimentos têm `imagemReal: false` — a foto mostrada **não
retrata** aquele empreendimento. Só dois têm imagem verdadeira:
`valflores-terraces` e `clt-centro-logistico-do-tojal`.

- **Onde:** `src/data/empreendimentos.json`
- **Nota:** o campo existe justamente para isto ser rastreável; não o remover
  ao substituir as fotos, pô-lo a `true` uma a uma.

### 3.2 Nomes da equipa

Pelo `CONTEXTO.md` §3, de toda a equipa só **António M Santos** é real. Marta
Sousa, Ricardo Nunes, Inês Carvalho, Pedro Almeida, Sofia Mendes, João Ferreira
e Ana Rocha são placeholder — nomes inventados de pessoas que não existem, hoje
publicados com foto e função.

- **Onde:** `src/data/equipa.json`

### 3.3 Perfis sociais para o Google

`seo.json > organizacao.sameAs` está vazio. É o que liga a marca à entidade nos
resultados do Google (Business Profile, LinkedIn, Instagram). O `seo-check`
avisa disto em cada corrida.

---

## 4. Por ligar quando houver decisão

### 4.1 Cloudflare Web Analytics

`seo.json > analytics.cloudflareToken` está vazio, de propósito — um beacon com
token de exemplo falha em todas as páginas e enche a consola de erros. Quando o
token real existir, o script **já entra pela via correta** (inerte, ativado
pelo consentimento da categoria Estatísticas).

Depois de preencher, correr `npm run cookies` para reconfirmar.

### 4.2 Domínio

`seo.json > dominio` está em `https://www.amsantos.pt`. Confirmar que é mesmo
este o domínio final antes de publicar — muda canonical, sitemap, robots,
Open Graph e JSON-LD de uma vez.

---

## 5. Higiene técnica

### 5.1 A baseline móvel está desatualizada

`npm run mobile:check` acusa regressões, mas a `scripts/mobile-baseline.json`
foi gravada antes do trabalho de design desta branch: diz 26 alvos de toque
pequenos em `portfolio@360` quando hoje são 0, e alturas de página que já não
correspondem. A comparação não está a medir nada de útil.

Confirmei que o aviso de cookies **não** contribui para o problema: nenhum
elemento `.cookies*` aparece nos resultados de transbordo, alvo pequeno ou texto
miúdo.

- **O que fazer:** regravar com `npm run mobile:baseline` — mas isso *abençoa*
  o estado atual, incluindo as alterações de design ainda não commitadas. É
  decisão sua e deve ser feita com a árvore de trabalho limpa.

### 5.2 Contraste das ligações no texto corrido

`.prosa a` usa `var(--accent)`, que dá **4,26:1** sobre o papel — abaixo do
mínimo AA de 4,5:1 para texto normal. O próprio `styles.css` documenta isto no
comentário dos tokens e tem `--accent-text` (5,24:1) precisamente para glifos.

Afeta o blog e as duas páginas legais novas. Não foi alterado por estar fora do
âmbito do trabalho de cookies e por mexer em todas as páginas de texto.

- **Onde:** `public/styles.css`, regra `.prosa a`
- **Correção:** trocar `var(--accent)` por `var(--accent-text)`

### 5.3 Várias sessões a editar o mesmo checkout

Durante este trabalho havia **4 outras sessões Claude Code abertas neste
repositório**. Uma delas reescreveu `scripts/mobile-check.mjs` e
`scripts/mobile-baseline.json` a meio das minhas corridas, o que fez os
resultados oscilarem sem o código ter mudado.

Não é um defeito do site, mas explica resultados contraditórios e vale a pena
ter presente: antes de culpar uma alteração por uma regressão num *gate*,
verificar se outra sessão lhe mexeu.

### 5.4 Sem registo de prova do consentimento

O site é estático e a decisão vive no equipamento do visitante. Para um site
institucional é prática corrente e proporcional. Se um dia for preciso
**demonstrar** consentimentos perante fiscalização (art. 7.º, n.º 1 do RGPD),
é necessário um serviço com registo do lado do servidor.

---

## O que já está fechado

Para não voltar a ser levantado:

- Consentimento de cookies completo — aviso, painel granular, retirada a um
  clique do rodapé, três categorias, registo de 180 dias.
- Nenhum recurso de terceiros arranca antes da decisão (verificado em Chrome).
- Aceitar e recusar com o mesmo peso visual, medido no ecrã.
- Traduzido PT/EN/FR.
- Duas páginas legais, com o inventário gerado a partir de `src/data/cookies.json`.
- Inventário editável no CMS, sem tocar em código.
- Testes: `npm run cookies` (671 verificações estáticas) e `npm run cookies:e2e`
  (35 testes de comportamento em Chrome). Ver `docs/COOKIES.md`.
