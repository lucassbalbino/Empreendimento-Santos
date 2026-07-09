# Design — Pasta de referências + regra no CONTEXTO.md

Data: 2026-07-09

## Objetivo

Dar ao cliente/usuário um espaço dedicado para depositar referências do site
(imagens, screenshots, links, briefings) e garantir que qualquer assistente de
IA consulte essas referências **antes** de alterar o site, para trabalhar com o
contexto visual/de conteúdo correto.

## Estrutura

Nova pasta `referencias/` na raiz do projeto:

```
referencias/
├── README.md        # índice + guia de uso (porta de entrada do agente)
├── sites/           # screenshots de sites de referência + LINKS.md
│   ├── LINKS.md     # lista de URLs de referência (semeado com habitatinvest.pt)
│   └── .gitkeep
├── imagens/         # mood board, logo/marca, paleta, fotos de inspiração
│   └── .gitkeep
└── documentos/      # briefings, PDFs, propostas do cliente
    └── .gitkeep
```

- `.gitkeep` em cada subpasta para versionar pastas vazias.
- `.gitignore` já permite imagens/PDFs (só ignora `node_modules/`, `dist/`, `.astro/`).

## CONTEXTO.md

1. **Banner no topo** (após o título): aviso de que, antes de qualquer alteração,
   o agente deve ler `referencias/README.md` e o material relevante da pasta.
2. **Nova Seção 2 "Referências"**: descreve a pasta, seu conteúdo e a regra de
   consulta obrigatória. Absorve a antiga "Seção 2 — Site de referência"
   (habitatinvest.pt migra para `referencias/sites/LINKS.md`, mas continua
   citado no CONTEXTO). Seções seguintes renumeradas.

## Fora de escopo

Nenhuma alteração no site em si (Astro `src/`, HTML legado na raiz). Apenas
organização de material de apoio + documentação.
