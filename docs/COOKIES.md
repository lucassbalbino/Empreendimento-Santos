# Cookies e consentimento

Como funciona o consentimento neste site, como acrescentar um serviço novo sem
partir a conformidade, e o que continua a exigir decisão humana.

> **Regra que resume tudo:** nada de terceiros pode ser pedido antes de o
> visitante decidir. Um aviso impecável não vale nada se o script já arrancou
> por trás dele — foi assim que caíram as coimas europeias mais pesadas.

---

## 1. As peças

| Ficheiro | Papel |
|---|---|
| `src/data/cookies.json` | **Fonte única de verdade.** Categorias, validade e inventário. |
| `public/consent.js` | O núcleo: lê/grava o registo, decide quando mostrar o aviso, prende o foco, ativa os scripts inertes. |
| `src/components/CookieBanner.astro` | Só markup. Sem `<script>` — os eventos são ligados por delegação. |
| `public/styles.css` (fim) | Desenho das duas camadas. |
| `public/i18n/{pt,en,fr}.json` → `common.cookies` | Textos do aviso nas três línguas. |
| `src/pages/politica-de-cookies.astro` | Política; a tabela é **gerada** a partir do `cookies.json`. |
| `src/pages/politica-de-privacidade.astro` | Tratamento de dados pessoais em geral. |
| `scripts/cookies-check.mjs` | Auditoria do HTML construído. Falha o build se a conformidade regredir. |
| `scripts/cookies-e2e.mjs` | Teste de comportamento em Chrome a sério. |

## 2. Categorias

Três, e só três:

- **`necessarios`** — sempre ativos, isentos de consentimento. Cobre o registo
  da própria escolha (`ams-consent`), o idioma (`ams-lang`) e a marca de que a
  animação de entrada já foi vista (`ams-preloaded`).
- **`estatisticas`** — hoje só o Cloudflare Web Analytics.
- **`marketing`** — hoje vazia; existe preparada para mapas, vídeos e pixels.

**Porque é que o idioma não é um interruptor.** A Lei n.º 41/2004 isenta o
armazenamento estritamente necessário a um serviço que o utilizador pediu — e a
preferência de idioma só existe porque ele a escolheu no seletor PT/EN/FR.
Pô-la num toggle significaria deixar de respeitar essa escolha a quem recusa,
o que é pior para o visitante e não é exigido pela lei.

## 3. Como o registo é guardado

Cookie de primeira parte `ams-consent`, 180 dias, `SameSite=Lax`, `Secure` em
HTTPS:

```json
{ "v": 1, "ts": 1756000000000, "cats": { "estatisticas": false, "marketing": false } }
```

Cookie ausente, JSON inválido, ou `v` diferente do `versao` do `cookies.json`
⇒ **não há decisão**: o aviso reaparece e nada não-essencial arranca.
`necessarios` nunca é gravado — não é uma escolha.

## 4. API

```js
amsConsent.get()               // {v,ts,cats} ou null se ainda não decidiu
amsConsent.has('estatisticas') // boolean ('necessarios' devolve sempre true)
amsConsent.aceitarTudo()
amsConsent.rejeitarTudo()
amsConsent.guardar({ estatisticas: true, marketing: false })
amsConsent.revogar()           // apaga o registo e reabre o aviso
amsConsent.abrir()             // abre o painel de definições
amsConsent.onChange(cb)        // cb(registo), já com o estado atual se houver
```

Evento no `document`: **`ams:consent`**, com o registo em `detail`. É o canal a
usar por qualquer script que precise de reagir.

---

## 5. Acrescentar um serviço novo

Exemplo: incorporar um mapa do Google numa página de empreendimento.

**Passo 1 — escrever o recurso inerte.** Nunca `<script src>` nem `<iframe src>`
direto. Em vez disso:

```html
<script type="text/plain"
        data-ams-consent="marketing"
        data-src="https://exemplo.com/widget.js"
        data-attr-defer=""
        data-attr-data-id="abc"></script>
```

O `consent.js` procura estes moldes, e para os que tenham a categoria
consentida cria um `<script>` real com o `src` de `data-src` e cada
`data-attr-X` convertido no atributo `X`. Corre na primeira carga, em cada
navegação e sempre que o consentimento muda.

Para *iframes* (mapas, vídeos) o padrão é o mesmo em espírito: não pôr o `src`
no HTML. Guardar o endereço num `data-src` e preenchê-lo a partir de um listener
de `ams:consent`, mostrando entretanto um marcador com um botão que abre o
painel. **Um iframe externo lê e escreve no equipamento tal como um script.**

**Passo 2 — declarar no inventário.** Acrescentar uma linha a
`src/data/cookies.json > inventario` (ou pelo CMS, em *Cookies (inventário)*)
com nome, categoria, tipo, fornecedor, duração e finalidade. A Política de
Cookies imprime esta lista automaticamente — não há tabela para editar à mão.

**Passo 3 — verificar.**

```
npm run cookies       # build + auditoria estática
npm run cookies:e2e   # comportamento em Chrome
```

O `cookies-check` falha se o recurso ficar ativo, e falha também se o inventário
tiver um item que a política não mostra.

**Passo 4 — perguntar-se se basta.** Se o serviço tratar dados pessoais por
conta da AM Santos, é um *subcontratante* e exige contrato nos termos do
artigo 28.º do RGPD. Isso não é código, é papel — ver §8.

---

## 6. O que os testes cobrem

`npm run cookies:check` — sobre o `dist/`, com cheerio:

- nenhum `<script>` ou `<iframe>` de terceiros ativo em nenhuma página;
- `#ams-cookies` presente e a nascer com `hidden`;
- todos os controlos do contrato presentes, e um interruptor por categoria opcional;
- **simetria**: aceitar e rejeitar com as mesmas classes e em igual número;
- nenhum interruptor opcional pré-marcado;
- `role="dialog"` + nome acessível nas duas camadas, `aria-modal` no painel;
- `[data-cookies="abrir"]` e ligações às duas políticas em **todas** as páginas;
- cada item do inventário mencionado na política;
- `consent.js` presente no build e sintaticamente válido.

O `/admin/` está excluído: é o back-office do CMS, alcançável só com credenciais,
não passa pelo `Base.astro` e carrega o Sveltia de um CDN por desenho.

`npm run cookies:e2e` — em Chrome, o que o HTML parado não consegue provar:
que nenhum cookie é gravado antes da decisão, que o Escape não consente, que o
foco entra no painel e volta, que os dois botões acabam do mesmo tamanho depois
de o CSS correr, que um script inerte só arranca depois do consentimento, e que
se consegue recusar só com o teclado.

## 7. Testar à mão no browser

1. Abrir o site numa janela anónima.
2. Ferramentas → *Application* → *Cookies*: **não pode existir `ams-consent`**.
   Separador *Network*, filtro por domínio: nenhum pedido para fora de `amsantos.pt`.
3. Carregar **Rejeitar tudo**. O cookie aparece com as opcionais a `false`.
   Recarregar: o aviso não volta.
4. Rodapé → **Definições de cookies**. O painel abre com os interruptores no
   estado gravado. Fechar com `Esc` **não** deve gravar nada.
5. Ligar *Estatísticas* → **Guardar escolhas**. Confirmar no cookie.
6. Consola: `amsConsent.revogar()`. O aviso volta e o cookie desaparece.
7. Repetir o passo 3 usando **só o teclado** (Tab e Enter).

---

## 8. Limites — o que isto NÃO resolve

Isto é infraestrutura. Há decisões que continuam a ser de quem responde
legalmente pela empresa:

- **Os textos legais têm de ser revistos.** As duas políticas cobrem o que a
  CNPD exige e estão escritas para serem percebidas, mas não substituem
  validação jurídica. Cada uma abre com um aviso nesse sentido no código.
- **A identificação da entidade está incompleta.** Enquanto
  `src/data/seo.json > nap.verificado` for `false`, a morada e o telefone são
  placeholder e **não são impressos** nas políticas — publicar dados falsos num
  documento legal é pior do que a lacuna. Falta ainda o NIPC.
- **O formulário de contacto não envia nada.** O `<form>` tem
  `onsubmit="return false"`. A Política de Privacidade descreve o tratamento que
  passará a existir quando for ligado a um destino; esse destino (email, serviço
  de formulários, CRM) tem de ser escolhido — e será um subcontratante.
- **Subcontratantes por nomear.** Alojamento e serviço de email têm de constar
  da política pelo nome, com contrato do artigo 28.º.
- **Não há registo de prova do consentimento.** O site é estático e a decisão
  vive no equipamento do visitante. Para um site institucional é a prática
  corrente e proporcional; se um dia for preciso *demonstrar* consentimentos
  (art. 7.º, n.º 1 do RGPD) perante uma fiscalização, é preciso um serviço com
  registo do lado do servidor.
- **O Cloudflare Web Analytics está desligado.** O `analytics.cloudflareToken`
  no `seo.json` está vazio. Quando for preenchido, o beacon já entra pela via
  correta (inerte, ativado por consentimento) — mas convém reconfirmar com o
  `npm run cookies` a seguir.
