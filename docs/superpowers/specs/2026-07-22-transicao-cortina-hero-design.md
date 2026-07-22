# Transição de cortina entre páginas — Design

**Data:** 2026-07-22
**Projeto:** mockup AM Santos (site Astro multi-página)

## Objetivo

Ao navegar entre páginas, a **hero image da página de destino** entra pelo topo
e desce como uma cortina sobre a página atual. Quando cobre o ecrã inteiro, o
conteúdo troca por baixo (invisível) e a nova página é revelada com a hero já no
topo. Efeito cinematográfico, coerente com o scroll interpolado (Lenis) e o
reveal-ao-rolar já existentes.

## 1. Comportamento (UX)

1. Utilizador clica num link qualificado (menu ou CTA principal).
2. A imagem da hero de destino entra pelo topo e desce como cortina — **só
   imagem, sem texto**.
3. Ao cobrir o ecrã inteiro, o DOM troca **por baixo** da cortina.
4. A cortina assenta/continua e revela a nova página, com a hero no topo.
5. Depois de assentar, o **título/texto da hero surge** (fade + rise de baixo
   para cima, coerente com o reveal do resto do site).

- Direção sempre **de cima para baixo**, em qualquer página.
- Timing proposto (ajustável): ~650ms descida → ~120ms hold no cover → ~600ms
  reveal.

## 2. Alcance e fallback

- **Disparam a cortina:** links do menu (Header) + CTAs/botões principais,
  marcados explicitamente com `data-curtain`.
- **Navegação normal (sem cortina):** links secundários e rodapé.
- `prefers-reduced-motion: reduce` → **sem cortina**, navegação direta.
- **Sem JS** → navegação nativa do browser (progressive enhancement).
- **Back/forward** e navegações não-marcadas → comportamento default, sem
  cortina (evita cortina "ao contrário"). Flag posta no clique do link marcado.

## 3. Arquitetura técnica (Astro ClientRouter + cortina manual)

### Peças

- **`<ClientRouter />`** no `<head>` do `Base.astro` — navegação suave, sem
  flash branco; scroll-reset, histórico e back/forward tratados pelo Astro.
- **`src/components/PageCurtain.astro`** (novo) — incluído uma vez no
  `Base.astro`. Contém o overlay `fixed` full-screen (z-index acima do Header) e
  o script que orquestra a cortina via Web Animations API.
- **Estilos da cortina** em `public/styles.css` (o CSS *live*).
- **Marcação dos links** com `data-curtain` no Header e nos CTAs principais.

### Fluxo da cortina

1. **Prefetch do Astro** ativado (hover/viewport) → HTML de destino já em cache.
2. No clique de um link `data-curtain`, marca-se uma flag "cortina pedida".
3. No hook `astro:before-swap`, lê-se a hero image do `event.newDocument`
   (query ao `.hero__bg--img`); como está prefetched, é instantâneo.
4. Cortina desce → hold no cover → swap do DOM → reveal.
5. Texto da hero entra depois de assentar.

### ⚠️ Pontos de integração críticos

Com navegação suave, os `<script>` de módulo **não voltam a correr** por página.
Hoje o `Base.astro` tem dois blocos que correm uma só vez e têm de ser
**religados no evento `astro:page-load`** (disparado em cada navegação, incl. a
primeira):

1. **Lenis** (scroll interpolado + parallax da hero) — hoje corre no load do
   módulo. Refatorar para reinicializar em `astro:page-load`, **destruindo a
   instância antiga** antes de criar a nova.
2. **Reveal-ao-rolar** (inline script) — hoje corre no `DOMContentLoaded`.
   Refatorar para correr também em `astro:page-load`.

Sem isto, a partir da 2ª página o scroll fica seco e o conteúdo não revela.

## 4. Ficheiros tocados

- `src/layouts/Base.astro` — adicionar `<ClientRouter />`; refactor Lenis +
  reveal para `astro:page-load`; incluir `<PageCurtain />`.
- `src/components/PageCurtain.astro` — **novo**.
- `public/styles.css` — estilos da cortina.
- `src/components/Header.astro` + páginas com CTAs — atributo `data-curtain`.

## 5. Fora de âmbito (YAGNI)

- Direções alternativas de cortina (só top-to-bottom).
- Cortina em back/forward.
- Overlay de cor/marca por cima da imagem (rejeitado: só imagem).
- View Transitions nativas via CSS (rejeitado: pouco controlo do hold/cover).
