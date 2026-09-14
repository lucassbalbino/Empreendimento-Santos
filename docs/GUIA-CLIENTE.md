# Guia rápido — Como editar o site

Este site tem um painel onde você edita os textos e as fotos sozinho, sem mexer
em código. Tudo o que você salvar entra no ar automaticamente.

---

## 1. Entrar no painel

1. Acesse **`seusite.com/admin`** (substitua pelo endereço final do site).
2. Clique em **Login** e entre com a conta indicada.
3. Você verá a lista de coleções: uma por página (**Início**, **Portfólio**,
   **Sobre Nós**, **Histórico**, **Equipa**, **Contactos**, **Blog**), mais
   **Empreendimentos**, **Página de empreendimento (textos comuns)**,
   **Geral (rodapé)**, **SEO** e **Cookies**.

> Na demonstração local, abra `http://localhost:4321/admin/index.html` depois de
> iniciar o site (veja o README/PUBLICACAO).

## 2. Trocar um texto

1. Clique na página (ex.: **Início**).
2. Clique no campo que quer mudar (ex.: "Hero — Título").
3. Edite o texto.
4. Clique em **Salvar / Publicar** no topo. Pronto — em ~1 minuto está no ar.

## 3. Trocar uma foto

1. Abra a página e encontre o campo de **Foto**.
2. Clique nele, escolha **enviar imagem** e selecione o arquivo do seu computador.
3. **Salvar / Publicar**.

Nota: em **Sobre Nós → 20 anos de solidez**, as fotos da grelha (2 colunas) trocam-se da mesma forma. Os números dessa secção são os mesmos da **Início → O Que Fazemos → Números**.

## 4. Empreendimentos: criar e mudar de fase

Cada empreendimento é uma entrada da coleção **Empreendimentos**, agrupada por
fase. Um projeto passa por três fases, e é o campo **Fase** que decide onde ele
aparece no site:

| Fase | Onde aparece |
|---|---|
| Projeto futuro | Portfólio → Projetos futuros |
| Em desenvolvimento | Portfólio → Projetos em desenvolvimento (e destaque na Início) |
| Concluído / vendido | Histórico |

**Criar um novo projeto futuro**
1. **Empreendimentos → Novo Empreendimento** (já vem com a fase "Projeto futuro").
2. Preencha nome, ano, localização, tipologia e resumo (obrigatórios), a foto e
   a ficha técnica (as linhas habituais já vêm sugeridas; as que ficarem vazias
   não aparecem).
3. **Publicar.** O nome define o endereço da página, que não muda depois.

**Passar de futuro para desenvolvimento, ou de desenvolvimento para o Histórico**
1. Abra o empreendimento e mude só a **Fase**.
2. **Publicar.** O projeto muda de página sozinho, e com ele o estado da obra,
   a frase de entrega ("Previsão 2029" → "Em construção · 2029" → "Concluído em
   2029"), a linha "Estado" da ficha e o botão da página.

Os campos **Estado da obra (exceção)** e **Frase de entrega (exceção)** só se
preenchem em casos especiais (ex.: vendido ainda em construção). Vazios, seguem
a fase — é isso que torna a mudança automática.

## 5. Adicionar um item a uma lista (serviço, pergunta, contador)

Essas listas têm um botão **"+ Adicionar"**:

- **Sobre Nós → O que nos move → Serviços**: adiciona um serviço novo.
- **Início → Perguntas frequentes**: adiciona uma pergunta.
- **Início → O Que Fazemos → Números**: adiciona um contador.
- **Geral (rodapé) → Telefones**: adiciona um número.

Passo a passo:
1. Abra a página, role até a lista (ex.: "Perguntas").
2. Clique em **"+ Adicionar"**.
3. Preencha os campos.
4. Reordene arrastando, se quiser.
5. **Salvar / Publicar**. O card aparece no site já no estilo certo.

Para **remover**, clique no ícone de lixeira do item. Para **reordenar**,
arraste pelo punho (ícone de arrastar).

## 6. O que você NÃO edita pelo painel (peça ao desenvolvedor)

- Criar um **tipo de seção novo** que ainda não existe (ex.: "Depoimentos").
- Mudar o **layout / design / cores**.
- Os **textos de interface** (menu, formulário de contacto, rótulos de secção)
  e o texto das **políticas de privacidade e de cookies**.
- As **traduções em inglês e francês**: ao editar um texto em português, a
  versão EN/FR não se atualiza sozinha.

> Regra simples: **"mais um da mesma família" (outro projeto, outro serviço) você
> faz sozinho.** Inventar uma família nova é trabalho de desenvolvimento.

## 7. Dúvidas comuns

- **Errei, e agora?** Toda alteração fica registrada no histórico (Git) e pode
  ser revertida. Nada se perde.
- **Quando aparece no site?** Cerca de 1 minuto depois de publicar.
- **Preciso instalar algo?** Não. O painel funciona pelo navegador.
