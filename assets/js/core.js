/*!
 * ЦРВУ — ядро страницы: пространство имён CRVU, утилиты, цели Яндекс Метрики,
 * шапка и мобильное меню, появление блоков при прокрутке, счётчики, мобильная панель.
 */
(function (w, d) {
  'use strict';

  var CRVU = (w.CRVU = w.CRVU || {});
  var METRIKA_ID = 103630235;
  var NBSP = '\u00a0';

  var mq = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : null;
  CRVU.reduced = !!(mq && mq.matches);

  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  CRVU.$ = $;
  CRVU.$$ = $$;

  /* ------------------------------------------------------------------ цели Метрики */
  /* Счётчик Метрики НЕ подключён на странице (см. README). Обёртка безопасна: если ym нет, ничего не происходит.
     Список целей: quiz_start, quiz_step_N, quiz_submit, upload_plan, calc_start, calc_result, calc_pdf,
     planner_select, planner_ics, doc_brief, doc_procurement, case_open, video_play, slider_use,
     click_phone, click_messenger, scroll_75 (раздел 12.1 стратегии) + дополнительные faq_open, swap_click, production_view. */
  var fired = {};
  CRVU.track = function (goal, params) {
    try {
      if (typeof w.ym === 'function') {
        if (params) { w.ym(METRIKA_ID, 'reachGoal', goal, params); } else { w.ym(METRIKA_ID, 'reachGoal', goal); }
      }
    } catch (e) { /* аналитика не должна ломать страницу */ }
  };
  CRVU.trackOnce = function (goal, params) {
    if (fired[goal]) { return; }
    fired[goal] = 1;
    CRVU.track(goal, params);
  };

  d.addEventListener('click', function (e) {
    var g = e.target.closest ? e.target.closest('[data-goal]') : null;
    if (g) { CRVU.track(g.getAttribute('data-goal')); }
  });

  /* ------------------------------------------------------------------ типографика в динамических строках */
  var SHORT = /(^|[^0-9A-Za-zА-Яа-яЁё-])([А-Яа-яЁё]{1,3})[ ]+(?=[0-9A-Za-zА-Яа-яЁё«(№₽+])/g;
  CRVU.nb = function (str) {
    var s = String(str);
    s = s.replace(/ +(—|–)(?= )/g, NBSP + '$1');
    for (var i = 0; i < 3; i++) { s = s.replace(SHORT, '$1$2' + NBSP); }
    s = s.replace(/₽\/м²/g, '₽/\u2060м²');
    s = s.replace(/(\d) (?=\d{3}(?!\d))/g, '$1' + NBSP);
    s = s.replace(/(\d) (?=[А-Яа-яЁёA-Za-z₽%°])/g, '$1' + NBSP);
    s = s.replace(/(\+7) (?=\()/g, '$1' + NBSP).replace(/(\)) (?=\d)/g, '$1' + NBSP);
    return s;
  };
  CRVU.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  CRVU.fmtNum = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); };
  CRVU.fmtArea = function (n) {
    var r = Math.round(n * 10) / 10;
    return String(r).replace('.', ',');
  };
  CRVU.plural = function (n, f) {
    n = Math.abs(n) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) { return f[2]; }
    if (n1 > 1 && n1 < 5) { return f[1]; }
    if (n1 === 1) { return f[0]; }
    return f[2];
  };

  /* ------------------------------------------------------------------ даты (в UTC, без часовых поясов) */
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  CRVU.parseISO = function (s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); };
  CRVU.todayUTC = function () { var n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); };
  CRVU.addDays = function (dt, n) { return new Date(dt.getTime() + n * 86400000); };
  CRVU.addMonths = function (dt, n) {
    var y = dt.getUTCFullYear(), m = dt.getUTCMonth() + n, day = dt.getUTCDate();
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, last)));
  };
  CRVU.subBdays = function (dt, n) {
    var x = new Date(dt.getTime());
    while (n > 0) {
      x = CRVU.addDays(x, -1);
      var wd = x.getUTCDay();
      if (wd !== 0 && wd !== 6) { n--; }
    }
    return x;
  };
  CRVU.dayDiff = function (a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); };
  CRVU.fmtDate = function (dt) { return pad(dt.getUTCDate()) + '.' + pad(dt.getUTCMonth() + 1) + '.' + dt.getUTCFullYear(); };
  CRVU.fmtDateLong = function (dt) { return dt.getUTCDate() + ' ' + MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCFullYear(); };
  CRVU.fmtDateShort = function (dt) { return dt.getUTCDate() + ' ' + MONTHS[dt.getUTCMonth()]; };
  CRVU.weekday = function (dt) { return WD[dt.getUTCDay()]; };
  CRVU.toICS = function (dt) { return dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate()); };

  /* ------------------------------------------------------------------ телефон, email, ошибки полей */
  CRVU.phoneDigits = function (v) {
    var s = String(v).replace(/\D/g, '');
    if (s.charAt(0) === '7' || s.charAt(0) === '8') { s = s.slice(1); }
    return s.slice(0, 10);
  };
  CRVU.formatPhone = function (ds) {
    if (!ds.length) { return ''; }
    var out = '+7 (' + ds.slice(0, 3);
    if (ds.length >= 3) { out += ')'; }
    if (ds.length > 3) { out += ' ' + ds.slice(3, 6); }
    if (ds.length > 6) { out += '-' + ds.slice(6, 8); }
    if (ds.length > 8) { out += '-' + ds.slice(8, 10); }
    return out;
  };
  CRVU.isPhone = function (v) { return CRVU.phoneDigits(v).length === 10; };
  CRVU.isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); };
  CRVU.maskPhone = function (inp) {
    if (!inp) { return; }
    var prevDigits = '', prevLen = 0;
    inp.addEventListener('focus', function () { if (!inp.value) { inp.value = '+7 ('; prevLen = inp.value.length; } });
    inp.addEventListener('blur', function () { if (!CRVU.phoneDigits(inp.value).length) { inp.value = ''; prevDigits = ''; prevLen = 0; } });
    inp.addEventListener('input', function (e) {
      var raw = inp.value;
      var caret = inp.selectionStart == null ? raw.length : inp.selectionStart;
      var atEnd = caret >= raw.length;
      var ds = CRVU.phoneDigits(raw);
      var deleting = e && e.inputType && e.inputType.indexOf('delete') === 0;
      if (deleting && ds === prevDigits && raw.length < prevLen) { ds = ds.slice(0, -1); atEnd = true; }
      var val = CRVU.formatPhone(ds);
      inp.value = val;
      if (atEnd) {
        try { inp.setSelectionRange(val.length, val.length); } catch (err) { /* type=tel допускает выделение */ }
      } else {
        var n = CRVU.phoneDigits(raw.slice(0, caret)).length, idx = 2, cnt = 0;
        while (idx < val.length && cnt < n) { if (/\d/.test(val.charAt(idx))) { cnt++; } idx++; }
        try { inp.setSelectionRange(idx, idx); } catch (err2) { /* ничего */ }
      }
      prevDigits = ds; prevLen = val.length;
    });
  };

  CRVU.showErr = function (input, msg) {
    var field = input.closest ? input.closest('.field') : null;
    var err = d.getElementById(input.id + '-e');
    if (field) { field.classList.add('has-error'); }
    input.setAttribute('aria-invalid', 'true');
    if (err) { err.textContent = CRVU.nb(msg); err.hidden = false; }
  };
  CRVU.clearErr = function (input) {
    var field = input.closest ? input.closest('.field') : null;
    var err = d.getElementById(input.id + '-e');
    if (field) { field.classList.remove('has-error'); }
    input.setAttribute('aria-invalid', 'false');
    if (err) { err.hidden = true; err.textContent = ''; }
  };
  /* снимаем ошибку, как только пользователь исправил поле */
  CRVU.autoClear = function (form) {
    if (!form) { return; }
    function clear(e) {
      var t = e.target;
      /* ошибка файла управляется отдельно (quiz.js), иначе она исчезнет сразу после показа */
      if (t && t.id && t.type !== 'file' && d.getElementById(t.id + '-e')) { CRVU.clearErr(t); }
    }
    form.addEventListener('input', clear);
    form.addEventListener('change', clear);
  };

  /* ------------------------------------------------------------------ отправка заявок (ЗАГЛУШКА) */
  /* Бэкенда у лендинга нет. Подключите отправку одним из способов:
       1) POST на свой обработчик (PHP/Node), который создаёт лид в CRM (Битрикс24 crm.lead.add, amoCRM unsorted)
          и отправляет письмо на manager@crvu.ru;
       2) сервис форм (Formspree, Getform и т. п.) с получателем manager@crvu.ru;
       3) вебхук CRM напрямую из браузера, если он допускает CORS.
     Файл плана площадки отправляйте как multipart/form-data, поле «plan» (в payload он лежит в payload.file).
     Успех: HTTP 200. Любой другой ответ или сетевая ошибка: показываем «Не удалось отправить заявку…».
     Пример рабочей реализации:
       var fd = new FormData();
       fd.append('payload', JSON.stringify(payload.data));
       if (payload.file) { fd.append('plan', payload.file, payload.file.name); }
       return fetch('/api/lead', { method: 'POST', body: fd }).then(function (r) {
         if (!r.ok) { throw new Error('HTTP ' + r.status); }
         return r.json();
       });
     Для проверки состояний ошибки добавьте к адресу страницы ?lead=fail или ?lead=slow. */
  CRVU.submitLead = function (payload, kind) {
    return new Promise(function (resolve, reject) {
      var q = w.location.search;
      if (/[?&]lead=slow\b/.test(q)) { return; /* никогда не отвечаем: проверка таймаута */ }
      setTimeout(function () {
        if (/[?&]lead=fail\b/.test(q)) { reject(new Error('stub: имитация ошибки')); return; }
        if (w.console && w.console.info) { w.console.info('[CRVU] заявка-заглушка (' + kind + '):', payload.data || payload); }
        resolve({ ok: true });
      }, 700);
    });
  };
  CRVU.utm = function () {
    var out = {}, p = new URLSearchParams(w.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid'].forEach(function (k) { if (p.get(k)) { out[k] = p.get(k); } });
    return out;
  };

  /* ------------------------------------------------------------------ мобильное меню */
  var burger = $('#burger'), menu = $('#mmenu');
  function setMenu(open) {
    if (!burger || !menu) { return; }
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('is-open', open);
    d.body.classList.toggle('menu-open', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) { setMenu(false); } });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    w.addEventListener('resize', function () { if (w.innerWidth > 1060) { setMenu(false); } });
  }

  /* ------------------------------------------------------------------ переход к квизу с подстановкой данных */
  CRVU.openQuiz = function (prefill, source) {
    var q = $('#quiz');
    if (!q) { return; }
    if (CRVU.quiz && CRVU.quiz.prefill) { CRVU.quiz.prefill(prefill || {}, source); }
    q.scrollIntoView({ behavior: CRVU.reduced ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () {
      var target = $('#quizOk:not([hidden])') || $('.qstep:not([hidden]) input:not([type=radio]):not([type=checkbox]), .qstep:not([hidden]) select');
      if (target && target.focus) { try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); } }
    }, CRVU.reduced ? 50 : 650);
  };
  d.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-open-quiz]') : null;
    if (!a) { return; }
    e.preventDefault();
    CRVU.openQuiz({}, a.getAttribute('data-open-quiz'));
  });

  /* ------------------------------------------------------------------ появление блоков */
  var rv = $$('.rv, .rv-wipe');
  if (!('IntersectionObserver' in w) || CRVU.reduced) {
    rv.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); rio.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    rv.forEach(function (el) { rio.observe(el); });
  }

  /* ------------------------------------------------------------------ счётчик в hero */
  $$('[data-count]').forEach(function (el) {
    var target = +el.getAttribute('data-count');
    if (!target || CRVU.reduced || !('IntersectionObserver' in w)) { return; }
    el.textContent = '0';
    var cio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) { return; }
      cio.disconnect();
      var t0 = null, dur = 1400;
      (function tick(ts) {
        if (t0 === null) { t0 = ts; }
        var p = Math.min(1, (ts - t0) / dur), k = 1 - Math.pow(1 - p, 3);
        el.textContent = CRVU.fmtNum(target * k);
        if (p < 1) { w.requestAnimationFrame(tick); } else { el.textContent = CRVU.fmtNum(target); }
      })(w.performance.now());
    }, { threshold: 0.4 });
    cio.observe(el);
  });

  /* ------------------------------------------------------------------ подсветка пункта меню, мобильная панель, «Наверх» */
  if ('IntersectionObserver' in w) {
    var links = $$('.nav a');
    var secs = ['calculator', 'planner', 'cases', 'process', 'faq'].map(function (id) { return d.getElementById(id); }).filter(Boolean);
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(function (s) { sio.observe(s); });

    var inQuiz = {};
    var qio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { inQuiz[en.target.id] = en.isIntersecting; });
      d.body.classList.toggle('in-quiz', !!(inQuiz.quiz || inQuiz.contacts));
    }, { threshold: 0.15 });
    ['quiz', 'contacts'].forEach(function (id) { var el = d.getElementById(id); if (el) { qio.observe(el); } });

    $$('[data-goal-view]').forEach(function (el) {
      var vio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { CRVU.trackOnce(el.getAttribute('data-goal-view')); vio.disconnect(); }
      }, { threshold: 0.35 });
      vio.observe(el);
    });
  }

  var toTop = $('#toTop'), ticking = false;
  function onScroll() {
    ticking = false;
    var y = w.pageYOffset || d.documentElement.scrollTop;
    if (toTop) { toTop.classList.toggle('is-on', y > 900); }
    var max = d.documentElement.scrollHeight - w.innerHeight;
    if (max > 0 && y / max >= 0.75) { CRVU.trackOnce('scroll_75'); }
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; w.requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})(window, document);
