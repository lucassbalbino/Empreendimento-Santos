# Figma — instalar plugins e importar o projeto

Guia para trazeres as páginas e os tokens do site para o Figma e
começares a fazer alterações estéticas.

---

## 0. Antes de começar

- **Conta Figma** (o plano gratuito chega). Podes usar no browser
  (`figma.com`) ou na app de desktop.
- **Fontes:** o site usa **Fraunces** e **Inter**, que são Google Fonts.
  O Figma já traz os Google Fonts, por isso normalmente **não precisas de
  instalar nada**. (Só se usares a app desktop e quiseres as fontes
  locais é que terias de as instalar pelo sistema.)
- Deixa o site a correr localmente: no terminal, dentro da pasta do
  projeto, `npm run dev` → fica em `http://localhost:4333`.

---

## 1. Instalar o plugin html.to.design (traz as páginas)

Este plugin converte uma página web em **camadas editáveis** no Figma.

1. Vai a **figma.com/community** e, na pesquisa, escreve
   **`html.to.design`**.
2. Abre o plugin e clica em **Open in…/Run** (ou **Install**). Fica
   disponível dentro de qualquer ficheiro Figma.
3. Para importar páginas em `localhost` (sem publicar o site), instala
   também a **extensão de browser** do html.to.design:
   - Chrome Web Store → procura **“html.to.design”** → **Adicionar ao
     Chrome**.

> Em alternativa a abrir a Community: dentro de um ficheiro Figma podes
> ir ao **menu principal → Plugins → Manage plugins / Find more plugins**
> e pesquisar aí. Ou usa a barra de **Actions** (`Ctrl/Cmd + /`) e escreve
> o nome do plugin.

---

## 2. Importar as páginas do site

Tens dois modos:

### A) Via extensão (recomendado para localhost — sem publicar)
1. Cria um ficheiro novo no Figma (**New design file**).
2. No browser, abre cada página do site, uma de cada vez:
   - `http://localhost:4333/`
   - `http://localhost:4333/portfolio`
   - `http://localhost:4333/historico`
   - `http://localhost:4333/sobre-nos`
   - `http://localhost:4333/sf-properties`
   - `http://localhost:4333/equipa`
   - `http://localhost:4333/contactos`
   - `http://localhost:4333/empreendimentos/santos`
3. Com a página aberta, clica no ícone da **extensão html.to.design** →
   **Import / Send to Figma**.
4. Volta ao Figma: a página aparece como um frame com camadas editáveis.
   Repete para cada URL.

### B) Via URL (se publicares o site)
1. Dentro do ficheiro Figma, corre o plugin **html.to.design**.
2. Escolhe **Import from URL** e cola o endereço público da página.
3. Repete para cada página.

> Dica: importa em frames de **1440px** (desktop). Se quiseres a versão
> móvel, reduz a janela do browser para ~390px de largura antes de
> capturar, e importa outra vez.

---

## 3. Instalar o Tokens Studio (traz cores/tipografia/espaços)

1. Em **figma.com/community**, pesquisa **`Tokens Studio for Figma`**
   (antigo “Figma Tokens”) e abre/instala.
2. Dentro de um ficheiro Figma, corre o plugin **Tokens Studio**.
3. No plugin: **Settings/menu → Import → Load from file** (ou arrasta o
   ficheiro) e escolhe **`design/tokens-studio.json`** (está neste repo).
4. Depois de carregado, usa a opção do plugin para **criar Styles /
   Variables** a partir dos tokens — ficas com as cores e os text styles
   disponíveis no Figma para aplicares aos elementos.

---

## 4. Fazer as alterações

- Com as páginas importadas (passo 2) e os tokens/styles aplicados
  (passo 3), edita livremente: muda cores, tipos, espaçamentos, testa
  variações de layout.
- Mantém a lógica da marca: **branco + preto + laranja** (`#ea5a17`) só
  como acento. Ver `design/ui-styleguide.md` para as regras e medidas.

---

## Limites a ter em conta

- O import é uma **aproximação** muito boa, mas não pixel-perfect.
- **Animações não passam** (reveal, cortinas, hover, count-up) — só o
  estado estático de cada página.
- O html.to.design no plano gratuito tem um **limite de importações por
  dia**; se precisares de muitas, espaça as importações.
- O que desenhares no Figma **não volta sozinho para o código** — serve
  de guia; depois passo eu as alterações aprovadas para o site.
