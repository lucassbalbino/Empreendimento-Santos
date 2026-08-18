/* Interações do mockup — header on-scroll, menu mobile, contadores.
   Re-executa a cada navegação suave (ViewTransitions), por isso liga os
   globais uma só vez (guarda __amsInit) e refaz o setup por `astro:page-load`. */
(function () {
  if (window.__amsInit) return;   // script re-executa no soft-nav; ligar 1x
  window.__amsInit = true;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header muda ao rolar (listener global permanente).
  var lastScrollY = window.scrollY;
  function updateHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var scrollY = window.scrollY;
    // Páginas sem hero (body.no-hero) nascem com o header sólido: sem imagem
    // escura por baixo, o estado transparente/logo-claro ficaria ilegível.
    header.classList.toggle('scrolled', document.body.classList.contains('no-hero') || scrollY > 60);

    // Esconde ao rolar para baixo, mostra ao rolar para cima. Só some depois
    // de um limiar para não oscilar logo no topo; menu mobile aberto nunca esconde.
    var nav = document.querySelector('.nav');
    var menuOpen = nav && nav.classList.contains('open');
    if (!menuOpen) {
      header.classList.toggle('site-header--hidden', scrollY > lastScrollY && scrollY > 120);
    }
    lastScrollY = scrollY;
  }
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Menu mobile — liga por elemento, evitando duplicar em elementos já ligados.
  function bindMenu() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.nav');
    if (toggle && nav && !toggle.dataset.bound) {
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
      nav.querySelectorAll('.nav__list a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('open'); });
      });
    }
  }

  // pt-PT usa ponto como separador de milhares (185.000).
  function fmt(el, value) {
    return (el.dataset.prefix || '') +
      Math.round(value).toLocaleString('pt-PT') +
      (el.dataset.suffix || '');
  }
  function animate(el) {
    var target = parseFloat(el.dataset.target) || 0;
    if (reduce) { el.textContent = fmt(el, target); return; }
    var dur = 1600;
    var start = performance.now();
    var step = function (now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(el, target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  // Contadores: IO novo por página (os elementos são novos após a troca).
  function bindCounters() {
    // .fact__v: contadores da home, que usam a grelha da ficha (.facts/.fact).
    var nums = document.querySelectorAll('.stat__num[data-target], .fact__v[data-target]');
    if (!nums.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  // ---------------------------------------------------------------------
  // I18N — troca de idioma PT/EN/FR client-side, sem recarregar a página.
  // Dicionários estáticos em /i18n/{lang}.json (mesma forma do pt.json).
  // Elementos marcados com data-i18n="caminho.para.chave" são preenchidos
  // a partir do dicionário do idioma atual (com fallback para PT). Guarda
  // tudo no closure desta IIFE (como lastScrollY) para sobreviver ao
  // soft-nav do ViewTransitions.
  // ---------------------------------------------------------------------
  var LANGS = ['pt', 'en', 'fr'];
  var LANG_KEY = 'ams-lang';
  var i18nDicts = {};      // cache por idioma, uma vez pedido nunca se repete
  var i18nLoading = {};
  var i18nListeners = [];  // callbacks de outros scripts (carrossel, modal) para re-traduzir conteúdo que não passa por data-i18n

  function getLang() {
    try {
      var l = localStorage.getItem(LANG_KEY);
      return LANGS.indexOf(l) !== -1 ? l : 'pt';
    } catch (e) { return 'pt'; }
  }

  function fetchDict(lang) {
    if (i18nDicts[lang]) return Promise.resolve(i18nDicts[lang]);
    if (i18nLoading[lang]) return i18nLoading[lang];
    i18nLoading[lang] = fetch('/i18n/' + lang + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data) i18nDicts[lang] = data; return data; })
      .catch(function () { return null; });
    return i18nLoading[lang];
  }

  function getPath(obj, path) {
    if (!obj || !path) return undefined;
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  // Chave → valor no idioma atual; nunca falha para PT ausente/incompleto.
  function i18nGet(path, fallback) {
    var lang = getLang();
    var val = getPath(i18nDicts[lang], path);
    if (val == null && lang !== 'pt') val = getPath(i18nDicts.pt, path);
    if (val == null) val = fallback;
    return val;
  }

  function i18nFactLabel(ptLabel) {
    var lang = getLang();
    var dict = lang !== 'pt' ? i18nDicts[lang] : null;
    var val = dict && dict.common && dict.common.factLabels && dict.common.factLabels[ptLabel];
    return val == null ? ptLabel : val;
  }

  // Endereços (morada) têm quebras de linha reais no JSON — reconstrói como
  // texto + <br>, tal como o Astro faz no server com moradaLinhas.map().
  function setMultiline(el, text) {
    el.textContent = '';
    String(text).split('\n').forEach(function (line, i) {
      if (i > 0) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(line));
    });
  }

  // Traduz um título TitleSplit. Escreve no <span> interior em vez do
  // textContent do <h1>/<h2>, para não deitar fora a marcação
  // .title-split__text de que o split-reveal precisa. O texto vai inteiro:
  // as quebras de linha são do browser (ver .title-split no styles.css), não
  // de uma contagem de palavras — é o que permite a cada idioma partir o
  // título onde lhe fica melhor.
  function applyTitleSplit(el, fullText) {
    var textEl = el.querySelector('.title-split__text');
    if (textEl) textEl.textContent = fullText;
  }

  // Dados extra da página (ex.: slug do empreendimento em [slug].astro) para
  // os templates data-i18n-tpl (ex.: "Interessado no {nome}?").
  function i18nPageVar(name) {
    var el = document.getElementById('i18n-page-data');
    if (!el) return null;
    try {
      var data = JSON.parse(el.textContent);
      if (name === 'nome' && data.slug) return i18nGet('empreendimentos.' + data.slug + '.nome', data.nome);
    } catch (e) {}
    return null;
  }

  function applyI18nDom() {
    var lang = getLang();
    document.documentElement.lang = lang;

    // src/scripts/split-reveal.js divide títulos/parágrafos em linhas
    // (.line/.line__inner) para a animação de entrada; a biblioteca
    // split-type guarda o HTML ORIGINAL numa cache interna e RESTAURA-o
    // sempre que o elemento é dividido de novo. Por isso é preciso desfazer
    // essa divisão ANTES de escrever texto traduzido (senão o próximo split
    // reporia o português por cima) e refazê-la DEPOIS (para ler o texto já
    // traduzido como nova base) — ver __amsSplitReveal em split-reveal.js.
    var sr = window.__amsSplitReveal;
    var revealed = sr ? sr.snapshotAndTeardown() : null;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.dataset.i18n;
      var val = i18nGet(key, null);
      if (val == null) return;
      var attr = el.dataset.i18nAttr;
      if (attr) { el.setAttribute(attr, val); return; }
      if (el.dataset.i18nSplit) applyTitleSplit(el, val);
      else if (el.dataset.i18nMultiline) setMultiline(el, val);
      else el.textContent = val;
    });

    // Frases com {nome} interpolado (ex.: CTA "Interessado no {nome}?").
    document.querySelectorAll('[data-i18n-tpl]').forEach(function (el) {
      var val = i18nGet(el.dataset.i18nTpl, null);
      if (val == null) return;
      var nome = i18nPageVar('nome');
      if (nome != null) val = val.split('{nome}').join(nome);
      if (el.dataset.i18nSplit) applyTitleSplit(el, val);
      else el.textContent = val;
    });

    // Rótulos de ficha técnica (Localização, Ano, Estado…) — a chave é o
    // próprio rótulo em português, comum a todos os empreendimentos.
    document.querySelectorAll('[data-i18n-label]').forEach(function (el) {
      el.textContent = i18nFactLabel(el.dataset.i18nLabel);
    });

    // Título "O Que Fazemos" da home vira lista numerada por palavra — o
    // título completo é dividido pelo mesmo separador "—" usado no server.
    var dofazemosWords = document.querySelectorAll('.dofazemos__word-t');
    if (dofazemosWords.length) {
      var titleFull = i18nGet('home.oQueFazemos.title', null);
      if (titleFull) {
        var parts = titleFull.split(/\s*—\s*/);
        if (parts.length === dofazemosWords.length) {
          dofazemosWords.forEach(function (el, i) { el.textContent = parts[i]; });
        }
      }
    }

    if (sr) sr.rebuild(revealed);   // reparte com o texto já traduzido como base

    updateLangSwitchUI(lang);
    // Evento dedicado (não 'resize'): recalcula o fit do TitleSplit sem
    // acordar também o handler de resize do split-reveal (que já foi
    // tratado acima, de forma síncrona e sem re-render duplicado).
    document.dispatchEvent(new Event('ams:i18n-applied'));
    i18nListeners.forEach(function (cb) { try { cb(lang); } catch (e) {} });
  }

  // Garante PT + o idioma alvo carregados antes de aplicar (PT serve de
  // fallback universal quando falta uma chave numa tradução).
  function applyLang() {
    var lang = getLang();
    Promise.all([fetchDict('pt'), lang !== 'pt' ? fetchDict(lang) : null]).then(applyI18nDom);
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyLang();
  }

  function updateLangSwitchUI(lang) {
    document.querySelectorAll('[data-lang-switch]').forEach(function (root) {
      var btn = root.querySelector('[data-lang-toggle]');
      if (btn) btn.textContent = getPath(i18nDicts.pt, 'common.langCodes.' + lang) || lang.toUpperCase();
      root.querySelectorAll('[data-lang-option]').forEach(function (opt) {
        var active = opt.getAttribute('data-lang-option') === lang;
        opt.classList.toggle('is-active', active);
        opt.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    });
  }

  // Menu de idioma em cascata: um botão liga/desliga uma lista (role=listbox)
  // cujas opções aparecem escalonadas (delay por --i em CSS). Fecha ao
  // escolher, ao clicar fora ou com Escape — como qualquer dropdown acessível.
  function bindLangSwitch() {
    document.querySelectorAll('[data-lang-switch]').forEach(function (root) {
      if (root.dataset.bound) return;
      root.dataset.bound = '1';
      var btn = root.querySelector('[data-lang-toggle]');
      var options = root.querySelectorAll('[data-lang-option]');
      if (!btn) return;

      function close() { root.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
      function toggle() {
        var open = root.classList.contains('is-open');
        // Fecha qualquer outro switch aberto (desktop + mobile podem coexistir no DOM).
        document.querySelectorAll('[data-lang-switch].is-open').forEach(function (r) { r.classList.remove('is-open'); });
        if (!open) { root.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      }
      btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
      options.forEach(function (opt) {
        opt.addEventListener('click', function () { setLang(opt.getAttribute('data-lang-option')); close(); });
      });
      document.addEventListener('click', function (e) { if (!root.contains(e.target)) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    });
  }

  // API mínima para outros scripts inline (carrossel de equipa, modal do
  // histórico) que gerem o próprio texto a partir de JSON embutido e por
  // isso não passam pelo varrimento de [data-i18n].
  window.__amsI18n = {
    getLang: getLang,
    get: i18nGet,
    factLabel: i18nFactLabel,
    onChange: function (cb) { i18nListeners.push(cb); },
  };

  function onPage() { updateHeader(); bindMenu(); bindCounters(); bindLangSwitch(); applyLang(); }
  // Dispara na 1.ª carga e em cada navegação suave.
  document.addEventListener('astro:page-load', onPage);
})();
