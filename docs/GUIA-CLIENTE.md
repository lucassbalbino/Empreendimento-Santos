# Guia rápido — Como editar o site

Este site tem um painel onde você edita os textos e as fotos sozinho, sem mexer
em código. Tudo o que você salvar entra no ar automaticamente.

---

## 1. Entrar no painel

1. Acesse **`seusite.com/admin`** (substitua pelo endereço final do site).
2. Clique em **Login** e entre com a conta indicada.
3. Você verá a lista de páginas: **Início**, **Portfólio**, **Sobre Nós** e
   **Geral (logo e rodapé)**.

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

Nota: em **Sobre Nós → O Que Fazemos**, as fotos da grelha (2 colunas) trocam-se da mesma forma, e o parágrafo com os números (projetos, m², investimento) edita-se como texto normal.

## 4. Adicionar um card novo (projeto, serviço, membro)

Essas listas têm um botão **"+ Adicionar"**:

- **Portfólio → Projetos**: adiciona um apartamento/empreendimento novo
  (nome, localização, tipologia, foto, descrição).
- **Sobre Nós → Serviços**: adiciona um serviço novo.
- **Início / Sobre Nós → Equipa → Membros**: adiciona uma pessoa.
- **Início → Números**: adiciona um contador.

Passo a passo:
1. Abra a página, role até a lista (ex.: "Projetos").
2. Clique em **"+ Adicionar"**.
3. Preencha os campos.
4. Reordene arrastando, se quiser.
5. **Salvar / Publicar**. O card aparece no site já no estilo certo.

Para **remover**, clique no ícone de lixeira do item. Para **reordenar**,
arraste pelo punho (ícone de arrastar).

## 5. O que você NÃO edita pelo painel (peça ao desenvolvedor)

- Criar um **tipo de seção novo** que ainda não existe (ex.: "Depoimentos").
- Mudar o **layout / design / cores**.
- Mexer nos **rótulos do menu** (por enquanto fixos).

> Regra simples: **"mais um da mesma família" (outro projeto, outro serviço) você
> faz sozinho.** Inventar uma família nova é trabalho de desenvolvimento.

## 6. Dúvidas comuns

- **Errei, e agora?** Toda alteração fica registrada no histórico (Git) e pode
  ser revertida. Nada se perde.
- **Quando aparece no site?** Cerca de 1 minuto depois de publicar.
- **Preciso instalar algo?** Não. O painel funciona pelo navegador.
