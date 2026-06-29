# Contexto do Projeto — Mockup "Empresa Bela"

> Documento de contexto para continuar o trabalho no VSCode (ou com qualquer assistente de IA).
> Registra a origem, os requisitos e as decisões já tomadas neste mockup.

---

## 1. O que é

Mockup/protótipo de site para um **cliente do ramo de construção civil**.
Público-alvo: **nobre, mas não luxuoso** (sóbrio, refinado, sem ostentação).

O conteúdo é **100% placeholder** — serve para validar layout e estrutura antes de ter o material real do cliente.

## 2. Site de referência (a "copiar")

Base estrutural e visual: **https://habitatinvest.pt/** (imobiliária/investimento, WordPress).
Páginas analisadas:

- `https://habitatinvest.pt/` (Início)
- `https://habitatinvest.pt/portfolio/`
- `https://habitatinvest.pt/sobre-nos/`

Fidelidade pedida: **cópia fiel do layout, com ajustes que façam sentido** para a proposta do cliente.

## 3. Convenções de placeholder

| Elemento        | Placeholder usado                          |
|-----------------|--------------------------------------------|
| Logo            | texto **"Logo"**                           |
| Imagens         | caixa hachurada com rótulo **"Imagem"**    |
| Textos          | **Lorem ipsum**                            |
| Itens de menu   | **Menu 01 … Menu 06**                      |
| Números/stats   | animam de 0 até um alvo (`data-target`)    |

## 4. Estrutura de arquivos

```
mockup/
├── index.html        # Início
├── portfolio.html    # Portfólio
├── sobre-nos.html    # Sobre Nós
├── styles.css        # Design system + todos os componentes
├── main.js           # Header on-scroll, menu mobile, contadores
└── CONTEXTO.md        # este arquivo
```

Navegação ativa entre as 3 páginas: logo → Início · Menu 01 → Sobre · Menu 02 → Portfólio.

## 5. Seções por página

- **index.html** — Hero · Quem Somos · O Que Fazemos + contadores · Portfólio (carrossel) · Track Record (seção escura) · Equipa · Contacto · Footer
- **portfolio.html** — Hero · Grid de projetos · Track Record · Contacto · Footer
- **sobre-nos.html** — Hero · Quem Somos · 3 verticais de atuação · Serviços (linhas alternadas) · Equipa · Contacto · Footer

## 6. Decisões de design

- **Paleta** (em `:root` no `styles.css`):
  - `--paper #f5f3ee` (off-white quente) · `--paper-alt #ece8df`
  - `--ink #20242a` (slate quase preto) · `--ink-soft #5c6068`
  - `--accent #8a6f4e` (bronze/argila contido) · `--dark #1b1e23`
- **Tipografia**: títulos em **Fraunces** (serifa leve, peso 300/400); corpo em **Inter**. Via Google Fonts.
- **Princípio**: nobre e sóbrio — sem dourados, brilhos ou efeitos chamativos. Bastante respiro/whitespace.
- **Responsivo**: breakpoints em 1024px e 760px; menu vira hambúrguer no mobile.

## 7. Como rodar localmente

1. Abrir a pasta `Empresa Bela` no VSCode.
2. Instalar a extensão **Live Server**.
3. Abrir `index.html` e clicar em **Go Live**.
   (ou simplesmente abrir os `.html` no navegador — não há build.)

## 8. Próximos passos / pendências

- [ ] Substituir placeholders pelo conteúdo real do cliente:
  - [ ] Logo definitivo
  - [ ] Textos (Quem Somos, serviços, bios da equipa)
  - [ ] Fotos dos projetos e da equipa
  - [ ] Contactos reais (morada, e-mail, telefone, redes)
  - [ ] Lista real de projetos no Portfólio (nome, localização, tipologia)
- [ ] Definir os rótulos finais do menu (hoje "Menu 01–06")
- [ ] Validar paleta/tipografia com o cliente
- [ ] (Opcional) páginas internas adicionais: detalhe de projeto, Equipa, Contactos, Track Record
- [ ] (Opcional) integrar o formulário de contacto a um backend/serviço de e-mail
