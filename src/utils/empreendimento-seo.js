import { seo } from './seo.js';

/* ---------------------------------------------------------------------------
   Conteúdo de SEO das fichas de empreendimento.

   O problema que isto resolve: 17 páginas de empreendimento que partilhavam
   dois parágrafos de template. Do ponto de vista do Google eram 17 páginas
   quase iguais a competir umas com as outras pelas mesmas pesquisas.

   Tudo o que sai daqui é composto a partir dos campos REAIS do
   src/data/empreendimentos.json (localização, tipologia, unidades, ano,
   estado). Não há texto inventado nem sinónimos rodados para simular
   diferença — a diferença vem de os empreendimentos serem mesmo diferentes.
   --------------------------------------------------------------------------- */

const MARCA = ' | ' + seo.marca;
const LIMITE_TITULO = 62;   // ~570px na SERP; acima disto o Google corta
const MIN_DESC = 120;
const MAX_DESC = 158;

/** Junta partes não vazias com um separador, sem separadores órfãos. */
function junta(partes, sep = ' ') {
  return partes.filter(Boolean).map((p) => String(p).trim()).filter(Boolean).join(sep);
}

/**
 * "T2 e T3" -> "de tipologia T2 e T3"; "Armazéns · 36.000 m²" -> "de Armazéns
 * · 36.000 m²". A palavra "tipologia" só encaixa quando o campo é mesmo uma
 * tipologia habitacional; o portefólio tem também um centro logístico e um
 * hotel, onde "de tipologia Armazéns · 36.000 m²" não é português.
 */
function tipologiaEmFrase(tipologia, unidades = '') {
  const tip = (tipologia ?? '').trim();
  if (!tip) return unidades || null;

  // Residencial: "10 apartamentos de tipologia T2 e T3".
  if (/^T\d/.test(tip)) return junta([unidades, `de tipologia ${tip}`]);

  /* Fora do residencial, `tipologia` e `unidades` dizem em parte a mesma coisa
     — o centro logístico tem unidades "27 armazéns" e tipologia "Armazéns ·
     36.000 m²", que encadeadas davam "27 armazéns de Armazéns · 36.000 m²".
     Deixam-se cair os segmentos já ditos. */
  const jaDito = unidades.toLowerCase();
  const restantes = tip
    .split('·')
    .map((s) => s.trim())
    .filter((s) => s && !jaDito.includes(s.toLowerCase()));

  if (!restantes.length) return unidades || null;
  const resto = restantes.join(' · ');

  /* A ordem depende do que sobrou. Se o que resta é o TIPO de edifício
     ("Hotel"), ele vem à frente e as unidades qualificam-no — "Hotel de 50
     quartos". Se o que resta é uma medida ("36.000 m²"), são as unidades que
     mandam na frase — "27 armazéns de 36.000 m²". */
  const restoENome = !/\d/.test(resto);
  return restoENome && unidades ? `${resto} de ${unidades}` : junta([unidades, `de ${resto}`]);
}

/**
 * Título da ficha. Tenta a versão mais rica ("Nome — T2 e T3 em Loures") e
 * desce até caber: um título cortado a meio da palavra-chave não serve de nada.
 */
export function tituloEmpreendimento(proj) {
  const nomeMinusculo = proj.nome.toLowerCase();

  /* Retira do fim do título o que o nome já disse — "Empreendimento Loures —
     Hotel — Hotel · 50 quartos em Loures" — mas SEGMENTO A SEGMENTO, nunca o
     campo inteiro. A diferença é decisiva: "Condomínio Tojalinho" contém
     "Tojalinho", e descartar a localização toda por causa disso deitava fora o
     "Loures" que vem a seguir — justamente a palavra por que as pessoas
     pesquisam. Cai o "Tojalinho" repetido, fica o concelho. */
  const semRepetidos = (campo, separador) =>
    (campo ?? '')
      .split(separador)
      .map((s) => s.trim())
      .filter((s) => s && !nomeMinusculo.includes(s.toLowerCase()));

  const tipologia = semRepetidos(proj.tipologia, '·').join(' · ');
  const local = semRepetidos(proj.localizacao, ',').join(', ');

  const cauda = tipologia && local ? `${tipologia} em ${local}` : tipologia || local;

  const candidatos = [
    junta([proj.nome, cauda ? '—' : null, cauda]),
    junta([proj.nome, local ? '—' : null, local]),
    proj.nome,
  ];
  for (const c of candidatos) {
    if ((c + MARCA).length <= LIMITE_TITULO) return c + MARCA;
  }
  return proj.nome + MARCA;
}

/**
 * Frase de estado — é o que distingue "à venda" de "vendido" na SERP.
 *
 * Lê `entrega` e `estado`, NUNCA `grupo`. O `grupo` organiza as listagens
 * (o que vai para o /historico e o que vai para o /portfolio) e não é sinónimo
 * de obra terminada: há três empreendimentos em `grupo: "concluido"` cujo
 * `estado` é "Em projeto" ou "Em construção" — são obras já vendidas, não
 * obras acabadas. Derivar a frase do grupo escrevia "Concluído em 2023" na
 * descrição de um projeto que os próprios dados dizem estar em fase de
 * projeto: uma afirmação falsa, na linha que o Google mostra na pesquisa.
 */
function fraseDeEstado(proj) {
  const fase = proj.entrega || proj.estado;
  return junta([fase ? `${fase}.` : null, proj.comercial ? `${proj.comercial}.` : null]);
}

/**
 * Descrição da ficha. Vai acrescentando orações até entrar na janela útil
 * (120–158 caracteres) e corta na fronteira de palavra — nunca a meio.
 */
export function descricaoEmpreendimento(proj) {
  const oracoes = [
    junta([
      `${proj.nome}:`,
      tipologiaEmFrase(proj.tipologia, proj.unidades),
      proj.localizacao ? `em ${proj.localizacao}` : null,
    ]) + '.',
    fraseDeEstado(proj),
    'Promoção e construção AM Santos.',
    'Fale connosco para saber mais.',
  ];

  let texto = '';
  for (const o of oracoes) {
    if (!o) continue;
    const proximo = junta([texto, o]);
    if (proximo.length > MAX_DESC) break;
    texto = proximo;
    if (texto.length >= MIN_DESC) break;
  }
  if (!texto) texto = proj.resumo ?? '';
  if (texto.length > MAX_DESC) {
    texto = texto.slice(0, MAX_DESC).replace(/\s+\S*$/, '') + '…';
  }
  return texto;
}

/**
 * Perguntas e respostas da ficha.
 *
 * Não levam schema FAQPage de propósito — o Google deixou de mostrar FAQ rich
 * results em maio de 2026. Continuam a valer como conteúdo: são a forma que as
 * pesquisas por voz e as perguntas feitas a assistentes têm ("onde fica o
 * Valflores Terraces", "que tipologias tem"), e é texto único por página.
 */
export function perguntasEmpreendimento(proj) {
  const perguntas = [];

  /* O concelho só se acrescenta quando a localização não o diz já. Vários
     empreendimentos têm `localizacao: "Sta. Iria de Azóia, Loures"` e
     `concelho: "Loures"` — encadeados às cegas davam "em Sta. Iria de Azóia,
     Loures, no concelho de Loures". */
  const localizacaoDizConcelho =
    proj.concelho &&
    proj.localizacao &&
    proj.localizacao.toLowerCase().includes(proj.concelho.toLowerCase());

  perguntas.push({
    p: `Onde fica o ${proj.nome}?`,
    r: `O ${proj.nome} fica em ${proj.localizacao}` +
      (proj.concelho && !localizacaoDizConcelho ? `, no concelho de ${proj.concelho}` : '') +
      `. A AM Santos promove e constrói sobretudo na zona de ${seo.organizacao.areasServidas.slice(0, 2).join(' e ')}.`,
  });

  if (proj.tipologia || proj.unidades) {
    const habitacional = /^T\d/.test((proj.tipologia ?? '').trim());
    perguntas.push({
      p: habitacional
        ? `Que tipologias tem o ${proj.nome}?`
        : `O que integra o ${proj.nome}?`,
      r: (proj.unidades ? `O empreendimento é composto por ${proj.unidades}` : 'O empreendimento') +
        (proj.tipologia ? `, ${habitacional ? 'com tipologia' : 'em'} ${proj.tipologia}.` : '.'),
    });
  }

  /* O `entrega` já costuma dizer a fase por extenso ("Em construção · 2026").
     Repetir "Estado atual: Em construção" a seguir é ruído; só se acrescenta
     quando traz informação que a frase de entrega não tem. */
  const entregaDizEstado =
    proj.entrega &&
    proj.estado &&
    proj.entrega.toLowerCase().includes(proj.estado.toLowerCase());

  perguntas.push({
    p: `Em que fase está o ${proj.nome}?`,
    r: junta([
      proj.entrega ? `${proj.entrega}.` : null,
      proj.estado && !entregaDizEstado ? `Estado atual: ${proj.estado}.` : null,
      proj.comercial ? `Situação comercial: ${proj.comercial}.` : null,
    ]),
  });

  perguntas.push({
    p: `Quem constrói o ${proj.nome}?`,
    r: `O ${proj.nome} é promovido e construído pela AM Santos, com 20 anos de experiência no mercado imobiliário sob a direção de ${seo.organizacao.fundador}. Cada empreendimento é acompanhado por equipa própria de arquitetura, engenharia, obra e gestão imobiliária.`,
  });

  /* A última pergunta segue a situação COMERCIAL, não o grupo de listagem:
     perguntar "ainda há unidades disponíveis" num empreendimento que está em
     comercialização, só porque vive no histórico, afastaria o único visitante
     que valia a pena converter. */
  const vendido = proj.comercial === 'Vendido';
  perguntas.push({
    p: vendido
      ? `Ainda há unidades disponíveis no ${proj.nome}?`
      : `Como posso visitar ou pedir informações sobre o ${proj.nome}?`,
    r: vendido
      ? `Este empreendimento está vendido. Para conhecer os empreendimentos em comercialização, veja o portfólio ou fale connosco.`
      : `Use o formulário no fim desta página, ou contacte a AM Santos diretamente, para agendar uma visita ou receber a informação comercial do ${proj.nome}.`,
  });

  return perguntas.filter((q) => q.r && q.r.trim().length > 0);
}
