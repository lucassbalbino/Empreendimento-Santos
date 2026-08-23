/* Núcleo do consentimento de cookies — registo, activação de terceiros e
   comportamento do aviso. O markup vive no CookieBanner.astro e o desenho no
   styles.css; aqui só entra a lógica, ligada por delegação (ver mais abaixo).

   Porquê um COOKIE e não o localStorage para guardar a decisão: (1) o registo
   tem de caducar sozinho — a validade de 180 dias obriga a voltar a perguntar,
   e o localStorage não sabe expirar; (2) o cookie viaja no pedido, por isso um
   dia em que exista CDN, edge worker ou uma página servida por outro lado, a
   decisão é legível sem JS; (3) é o próprio artefacto que estamos a explicar na
   Política de Cookies (ams-consent, primeira parte) — guardá-lo noutro sítio
   obrigaria a documentar duas coisas para o mesmo fim.

   ES5-ish, IIFE, `var`, sem dependências nem build — igual ao /main.js. */
(function () {
  if (window.__amsConsentInit) return;   // o ficheiro re-executa no soft-nav; ligar 1x
  window.__amsConsentInit = true;

  var COOKIE = 'ams-consent';
  var VALIDADE_DIAS = 180;   // espelha src/data/cookies.json > validadeDias
  var VERSAO = 1;            // fallback; a real vem do data-versao do #ams-cookies
  // Categorias opcionais conhecidas. Serve de rede: a lista real é lida dos
  // toggles presentes no painel, para acrescentar uma categoria ao cookies.json
  // (e ao markup) não obrigar a mexer neste ficheiro.
  var OPCIONAIS = ['estatisticas', 'marketing'];
  var ESPERA_PRELOADER = 400;   // ms depois do wipe de saída, para não colidir com ele

  var ouvintes = [];      // callbacks registados em amsConsent.onChange
  var ultimoFoco = null;  // elemento que abriu o painel, para lhe devolver o foco

  // ---------------------------------------------------------------------
  // Cookie à mão
  // ---------------------------------------------------------------------

  function raiz() { return document.getElementById('ams-cookies'); }

  // A versão do registo é a do cookies.json, exposta pelo componente em
  // data-versao. Subir essa versão invalida os consentimentos antigos (mudou o
  // que se pede), e é por isso que a leitura tem de ser sempre feita ao DOM
  // actual e não a uma constante compilada neste ficheiro.
  function versaoAtual() {
    var el = raiz();
    var v = el && parseInt(el.getAttribute('data-versao'), 10);
    return v > 0 ? v : VERSAO;
  }

  function validadeDias() {
    var el = raiz();
    var d = el && parseInt(el.getAttribute('data-validade'), 10);
    return d > 0 ? d : VALIDADE_DIAS;
  }

  function lerCookie(nome) {
    var alvo = nome + '=';
    var partes = String(document.cookie || '').split(';');
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i].replace(/^\s+/, '');
      if (p.indexOf(alvo) === 0) return p.slice(alvo.length);
    }
    return null;
  }

  // Secure só em https: em localhost (http) o browser recusa o cookie em
  // silêncio e o banner voltaria a aparecer a cada página em desenvolvimento.
  function sufixo() {
    return '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }

  function escreverCookie(nome, valor, dias) {
    document.cookie = nome + '=' + valor + '; max-age=' + (dias * 86400) + sufixo();
  }

  function apagarCookie(nome) {
    document.cookie = nome + '=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT' + sufixo();
  }

  // ---------------------------------------------------------------------
  // Registo
  // ---------------------------------------------------------------------

  // null = ainda não há decisão. Cookie ausente, JSON partido ou versão
  // diferente da actual caem todos aqui: qualquer dúvida sobre o que foi
  // consentido trata-se como "não consentido" e volta a perguntar-se.
  function get() {
    var bruto = lerCookie(COOKIE);
    if (!bruto) return null;
    try {
      var reg = JSON.parse(decodeURIComponent(bruto));
      if (!reg || typeof reg !== 'object' || !reg.cats) return null;
      if (reg.v !== versaoAtual()) return null;   // migração de versão = perguntar de novo
      return reg;
    } catch (e) {
      return null;
    }
  }

  function has(cat) {
    if (cat === 'necessarios') return true;   // isentos, nunca dependem da decisão
    var reg = get();
    return !!(reg && reg.cats && reg.cats[cat] === true);
  }

  // Ids das categorias opcionais: os toggles que o painel mostrar, unidos aos
  // conhecidos (o painel pode ainda não estar no DOM quando isto é chamado).
  function categoriasOpcionais() {
    var ids = OPCIONAIS.slice();
    var caixas = document.querySelectorAll('[data-cookies-cat]');
    for (var i = 0; i < caixas.length; i++) {
      var id = caixas[i].getAttribute('data-cookies-cat');
      if (id && id !== 'necessarios' && ids.indexOf(id) === -1) ids.push(id);
    }
    return ids;
  }

  // O evento vai primeiro: é por ele que os scripts inertes são reavaliados
  // (o listener está no fundo do ficheiro), e é o canal público — quem não
  // controlamos ouve `ams:consent`, quem se registou por onChange vem a seguir.
  function anunciar(reg) {
    document.dispatchEvent(new CustomEvent('ams:consent', { detail: reg }));
    for (var i = 0; i < ouvintes.length; i++) {
      try { ouvintes[i](reg); } catch (e) {}
    }
  }

  // `necessarios` nunca é gravado como false — não é uma escolha, é o mínimo
  // para o site funcionar, e escrevê-lo daria a entender que é negociável.
  function guardar(escolhas) {
    escolhas = escolhas || {};
    var cats = {};
    var ids = categoriasOpcionais();
    for (var i = 0; i < ids.length; i++) cats[ids[i]] = escolhas[ids[i]] === true;

    var reg = { v: versaoAtual(), ts: Date.now(), cats: cats };
    escreverCookie(COOKIE, encodeURIComponent(JSON.stringify(reg)), validadeDias());
    fecharTudo();
    anunciar(reg);
    return reg;
  }

  function todas(valor) {
    var ids = categoriasOpcionais();
    var escolhas = {};
    for (var i = 0; i < ids.length; i++) escolhas[ids[i]] = valor;
    return escolhas;
  }

  function aceitarTudo() { return guardar(todas(true)); }
  function rejeitarTudo() { return guardar(todas(false)); }

  // Revogar = voltar ao estado "nunca decidiu": apaga o registo, apaga o que os
  // terceiros consentidos possam ter deixado, e reabre o aviso. O que já foi
  // injectado nesta página não se desinjecta (um script carregado não se
  // descarrega); deixa de ser carregado a partir do próximo pedido de página,
  // que é o que a lei exige — o efeito é o mesmo de nunca ter sido aceite.
  function revogar() {
    apagarCookie(COOKIE);

    // Cookies de terceiros a limpar. Hoje o único serviço não essencial é o
    // Cloudflare Web Analytics, que não escreve cookies — daí a lista vazia. Os
    // _cf* que possam existir vêm da própria Cloudflare no nosso domínio e são
    // apagáveis por JS; os de terceiros a sério (domínios que não o nosso) só
    // se apagam do lado deles, por isso, quando houver algum, a linha certa é
    // acrescentá-lo aqui E deixar de o carregar (é o que o data-ams-consent faz).
    //   ex.: ['_ga', '_gid', '_fbp'].forEach(apagarCookie);
    var nomes = String(document.cookie || '').split(';');
    for (var i = 0; i < nomes.length; i++) {
      var n = nomes[i].split('=')[0].replace(/^\s+/, '');
      if (n.indexOf('_cf') === 0) apagarCookie(n);
    }

    fecharPainel(false);
    mostrarAviso();
    anunciar(null);
  }

  function onChange(cb) {
    if (typeof cb !== 'function') return;
    ouvintes.push(cb);
    var reg = get();
    if (reg) { try { cb(reg); } catch (e) {} }   // já há decisão: o ouvinte chega atrasado, ponha-se a par
  }

  // ---------------------------------------------------------------------
  // Activação dos scripts inertes (§4 do contrato)
  // ---------------------------------------------------------------------

  // Um terceiro nunca entra directo no HTML: fica como <script type="text/plain">
  // (que o browser não executa) e só aqui é convertido num <script> a sério, se
  // a categoria estiver consentida. Os atributos passam por data-attr-* para o
  // original continuar inofensivo — um `src` verdadeiro num text/plain não
  // corre, mas `defer`/`data-cf-beacon` no original só confundiriam a leitura.
  function activarScripts() {
    var inertes = document.querySelectorAll('script[type="text/plain"][data-ams-consent]');
    for (var i = 0; i < inertes.length; i++) {
      var molde = inertes[i];
      if (molde.getAttribute('data-ams-ativado')) continue;      // já injectado nesta página
      if (!has(molde.getAttribute('data-ams-consent'))) continue;

      var real = document.createElement('script');
      var attrs = molde.attributes;
      for (var j = 0; j < attrs.length; j++) {
        if (attrs[j].name.indexOf('data-attr-') === 0) {
          real.setAttribute(attrs[j].name.slice(10), attrs[j].value);
        }
      }
      var src = molde.getAttribute('data-src');
      if (src) real.src = src;
      else real.text = molde.textContent;   // também serve para snippets inline

      molde.setAttribute('data-ams-ativado', '1');
      (molde.parentNode || document.body).insertBefore(real, molde.nextSibling);
    }
  }

  // ---------------------------------------------------------------------
  // Estado visual
  // ---------------------------------------------------------------------

  function mostrarAviso() {
    var el = raiz();
    if (!el) return;
    el.hidden = false;
    // Uma volta de frame antes da classe, para a transição de entrada do CSS
    // ter um estado inicial pintado de onde partir (com hidden não há paint).
    requestAnimationFrame(function () {
      el.classList.add('is-visivel');
      var aviso = el.querySelector('.cookies__aviso');
      // Foco programático na 1.ª camada: é `role="dialog"` e tem de ser
      // anunciada, mas NÃO prende o foco — uma barra que prendesse o teclado
      // era uma parede de cookies, e o site continua utilizável sem decidir.
      if (aviso) {
        if (!aviso.hasAttribute('tabindex')) aviso.setAttribute('tabindex', '-1');
        try { aviso.focus({ preventScroll: true }); } catch (e) { aviso.focus(); }
      }
    });
  }

  function esconderTudo() {
    var el = raiz();
    if (!el) return;
    el.classList.remove('is-visivel');
    el.classList.remove('is-painel');
    el.hidden = true;
  }

  // Trava o scroll como o resto do site (PageCurtain, preloader): pelo Lenis.
  function travarScroll() {
    if (window.__amsLenis && typeof window.__amsLenis.stop === 'function') window.__amsLenis.stop();
  }

  // Destravar só se mais ninguém estiver a travar. O preloader (is-loading) e a
  // cortina de navegação também param o Lenis e chamam start() quando acabam;
  // se o painel se fechasse por cima deles, a página começava a rolar por baixo
  // de uma animação que ainda decorre.
  function destravarScroll() {
    var root = document.documentElement;
    if (root.classList.contains('is-loading') || window.__amsCurtainBusy) return;
    if (window.__amsLenis && typeof window.__amsLenis.start === 'function') window.__amsLenis.start();
  }

  function painelAberto() {
    var el = raiz();
    return !!(el && el.classList.contains('is-painel'));
  }

  function abrir() {
    var el = raiz();
    if (!el) return;
    ultimoFoco = document.activeElement;
    el.hidden = false;
    el.classList.add('is-painel');
    sincronizarToggles();
    travarScroll();
    requestAnimationFrame(function () {
      var painel = el.querySelector('.cookies__painel');
      if (!painel) return;
      var alvos = focaveis(painel);
      var primeiro = alvos[0] || painel;
      if (!primeiro.hasAttribute('tabindex') && primeiro === painel) painel.setAttribute('tabindex', '-1');
      try { primeiro.focus({ preventScroll: true }); } catch (e) { primeiro.focus(); }
    });
  }

  // Fechar o painel NÃO grava nada: fechar não é consentir (§8). Se ainda não
  // houver decisão, a 1.ª camada volta a ficar à vista; se já houver, o
  // conjunto todo desaparece.
  function fecharPainel(devolverFoco) {
    var el = raiz();
    if (!el) return;
    el.classList.remove('is-painel');
    destravarScroll();
    if (get()) esconderTudo();
    else el.classList.add('is-visivel');
    if (devolverFoco !== false && ultimoFoco && document.contains(ultimoFoco)) {
      try { ultimoFoco.focus({ preventScroll: true }); } catch (e) { ultimoFoco.focus(); }
    }
    ultimoFoco = null;
  }

  function fecharTudo() {
    destravarScroll();
    esconderTudo();
    ultimoFoco = null;
  }

  // Os toggles opcionais nascem SEMPRE desligados quando não há decisão — é o
  // requisito com mais dentes de todos (§8): pré-seleccionar seria recolher
  // consentimento por omissão, que não é consentimento nenhum.
  function sincronizarToggles() {
    var reg = get();
    var caixas = document.querySelectorAll('[data-cookies-cat]');
    for (var i = 0; i < caixas.length; i++) {
      var id = caixas[i].getAttribute('data-cookies-cat');
      if (id === 'necessarios') { caixas[i].checked = true; caixas[i].disabled = true; continue; }
      caixas[i].checked = !!(reg && reg.cats && reg.cats[id] === true);
    }
  }

  function lerToggles() {
    var escolhas = {};
    var caixas = document.querySelectorAll('[data-cookies-cat]');
    for (var i = 0; i < caixas.length; i++) {
      var id = caixas[i].getAttribute('data-cookies-cat');
      if (id && id !== 'necessarios') escolhas[id] = caixas[i].checked === true;
    }
    return escolhas;
  }

  // ---------------------------------------------------------------------
  // Eventos — por DELEGAÇÃO, num único listener no document
  // ---------------------------------------------------------------------
  //
  // O markup do aviso é re-renderizado a cada navegação (ViewTransitions troca
  // o <body> inteiro) e o gatilho [data-cookies="abrir"] pode estar no rodapé,
  // dentro da Política de Cookies ou em qualquer página futura. Ligar handlers
  // a elementos obrigaria a religar tudo a cada astro:page-load e a marcar
  // elementos já ligados (o truque do dataset.bound do main.js). Com um
  // listener no document, o DOM pode nascer e morrer à vontade que os botões
  // funcionam na mesma — inclusive os que ainda não existem.

  document.addEventListener('click', function (e) {
    var alvo = e.target && e.target.closest ? e.target.closest('[data-cookies]') : null;
    if (!alvo) return;
    var accao = alvo.getAttribute('data-cookies');
    if (accao === 'aceitar') { e.preventDefault(); aceitarTudo(); }
    else if (accao === 'rejeitar') { e.preventDefault(); rejeitarTudo(); }
    else if (accao === 'personalizar' || accao === 'abrir') { e.preventDefault(); abrir(); }
    else if (accao === 'guardar') { e.preventDefault(); guardar(lerToggles()); }
    else if (accao === 'fechar') { e.preventDefault(); fecharPainel(true); }
  });

  // Elementos que podem receber foco dentro do painel, pela ordem do DOM.
  function focaveis(caixa) {
    var sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),' +
              ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var todos = caixa.querySelectorAll(sel);
    var lista = [];
    for (var i = 0; i < todos.length; i++) {
      var el = todos[i];
      // offsetParent nulo = escondido por display:none (ou fixed, daí o segundo teste).
      if (el.offsetParent !== null || el.getClientRects().length) lista.push(el);
    }
    return lista;
  }

  document.addEventListener('keydown', function (e) {
    if (!painelAberto()) return;
    var el = raiz();
    var painel = el && el.querySelector('.cookies__painel');
    if (!painel) return;

    // Escape fecha o painel SEM gravar. Nunca é interpretado como aceitação nem
    // como recusa: uma decisão só nasce de um clique explícito num dos botões.
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      fecharPainel(true);
      return;
    }

    // Foco preso em ciclo: aria-modal="true" promete ao leitor de ecrã que o
    // resto da página não existe enquanto o painel está aberto, e o Tab tem de
    // cumprir essa promessa (senão o teclado sai para trás do painel).
    if (e.key !== 'Tab') return;
    var lista = focaveis(painel);
    if (!lista.length) { e.preventDefault(); return; }
    var primeiro = lista[0];
    var ultimo = lista[lista.length - 1];
    var actual = document.activeElement;
    if (e.shiftKey && (actual === primeiro || !painel.contains(actual))) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && (actual === ultimo || !painel.contains(actual))) {
      e.preventDefault();
      primeiro.focus();
    }
  });

  // ---------------------------------------------------------------------
  // Momento de aparição (§6)
  // ---------------------------------------------------------------------

  var esperaObs = null;
  var esperaTimer = null;

  function cancelarEspera() {
    if (esperaObs) { esperaObs.disconnect(); esperaObs = null; }
    if (esperaTimer) { clearTimeout(esperaTimer); esperaTimer = null; }
  }

  // Com preloader, o aviso espera que a animação de entrada saia de cena. Não é
  // cosmética: aparecer por cima do contador roubava o foco a meio do wipe e
  // dava uma leitura de "parede" logo à entrada — exactamente o oposto do que
  // um aviso não modal deve ser. Sem preloader (soft-nav, reduced-motion, 2.ª
  // visita na mesma sessão) não há nada por que esperar e aparece já.
  function agendarAviso() {
    cancelarEspera();
    var root = document.documentElement;

    function agora() {
      cancelarEspera();
      if (get()) return;   // decidiu entretanto (ex.: noutro separador)
      mostrarAviso();
    }

    if (!root.classList.contains('is-loading')) { agora(); return; }

    esperaObs = new MutationObserver(function () {
      if (root.classList.contains('is-loading')) return;
      if (esperaObs) { esperaObs.disconnect(); esperaObs = null; }
      esperaTimer = setTimeout(agora, ESPERA_PRELOADER);
    });
    esperaObs.observe(root, { attributes: true, attributeFilter: ['class'] });
    // Teto duro: se o preloader ficar preso, o aviso não pode ficar preso com ele.
    esperaTimer = setTimeout(agora, 6000);
  }

  function porPagina() {
    activarScripts();          // markup novo = scripts inertes novos a reavaliar
    if (get()) { esconderTudo(); cancelarEspera(); return; }
    agendarAviso();
  }

  // Uma decisão tomada noutro separador vale neste: re-avalia os inertes.
  document.addEventListener('ams:consent', activarScripts);

  // API pública. Documentada no CONTRATO-COOKIES.md §3 — outros scripts devem
  // preferir o evento `ams:consent` / onChange a sondar o get().
  window.amsConsent = {
    get: get,
    has: has,
    aceitarTudo: aceitarTudo,
    rejeitarTudo: rejeitarTudo,
    guardar: guardar,
    revogar: revogar,
    abrir: abrir,
    onChange: onChange,
  };

  // Dispara na 1.ª carga e em cada navegação suave.
  document.addEventListener('astro:page-load', porPagina);
})();
