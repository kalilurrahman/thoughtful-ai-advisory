/*
 * AEGIS site script (loaded deferred on every page; no dependencies, no cookies).
 *  - progressive-enhancement navigation (mobile toggle, one-open disclosure menus, Escape)
 *  - accessible lead forms posting JSON to /api/contact (contract: CONTRIBUTING.md §3)
 *  - shared helpers exported as window.AEGIS (and module.exports for Node tests)
 */
(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else {
    root.AEGIS = api;
    if (root.document) {
      if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', function () { api.init(root.document); }); }
      else { api.init(root.document); }
    }
  }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var EMAIL_RE = /^[A-Za-z0-9._%+'-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}$/;
  var DEFAULT_CONFIG = { api_base: '/api', free_mail_domains: [], contact_email: '', privacy_url: '/legal/privacy/', demo_url: '/contact/request-demo/' };
  var UNAVAILABLE_STATUS = [0, 404, 405, 501, 502, 503, 504];

  function readConfig(doc) {
    try {
      var el = doc && doc.getElementById('aegis-config');
      if (el) {
        var cfg = JSON.parse(el.textContent);
        Object.keys(DEFAULT_CONFIG).forEach(function (k) { if (cfg[k] === undefined) { cfg[k] = DEFAULT_CONFIG[k]; } });
        return cfg;
      }
    } catch (e) { /* fall through */ }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  function isValidEmail(email) { return EMAIL_RE.test(String(email || '').trim()); }

  function emailDomain(email) {
    var s = String(email || '').trim().toLowerCase();
    var i = s.lastIndexOf('@');
    return i === -1 ? '' : s.slice(i + 1);
  }

  /** True when the address is well-formed and not on the free-mail list (incl. subdomains). */
  function isBusinessEmail(email, freeDomains) {
    if (!isValidEmail(email)) { return false; }
    var d = emailDomain(email);
    var list = freeDomains || [];
    for (var i = 0; i < list.length; i++) {
      var f = String(list[i]).toLowerCase();
      if (d === f || d.slice(-(f.length + 1)) === '.' + f) { return false; }
    }
    return true;
  }

  /** Allow only same-origin relative paths or http(s) URLs for links received from the API. */
  function safeUrl(url, requiredPrefix) {
    if (typeof url !== 'string' || !url) { return null; }
    var u = url.trim();
    var path;
    if (/^\/(?!\/)/.test(u)) { path = u; }
    else {
      var m = /^https?:\/\/[^/\s?#]+(\/[^\s]*)?$/i.exec(u);
      if (!m) { return null; }
      path = m[1] || '/';
    }
    if (requiredPrefix && path.indexOf(requiredPrefix) !== 0) { return null; }
    return u;
  }

  /**
   * Classify an HTTP outcome. kind: ok | client_error | server_error | unavailable.
   * "unavailable" = the API is not deployed (static hosting): network error, 404/405/50x,
   * or a non-JSON answer (e.g. an HTML error page).
   */
  function classify(status, contentType) {
    var json = /json/i.test(contentType || '');
    if (status >= 200 && status < 300) { return (json || status === 204) ? 'ok' : 'unavailable'; }
    if (UNAVAILABLE_STATUS.indexOf(status) !== -1 || !json) { return 'unavailable'; }
    if (status >= 500) { return 'server_error'; }
    return 'client_error';
  }

  function postJSON(path, body, opts) {
    opts = opts || {};
    var cfg = opts.config || readConfig(root.document);
    var url = (cfg.api_base || '/api').replace(/\/$/, '') + path;
    var fetchFn = opts.fetch || (root.fetch ? root.fetch.bind(root) : null);
    if (!fetchFn) { return Promise.resolve({ kind: 'unavailable', status: 0, data: null }); }
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, opts.timeout || 20000) : null;
    return fetchFn(url, {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      var ctype = (res.headers && res.headers.get) ? res.headers.get('content-type') : '';
      var kind = classify(res.status, ctype);
      if (!/json/i.test(ctype || '') || res.status === 204) { return { kind: kind, status: res.status, data: null }; }
      return res.json().then(function (data) { return { kind: kind, status: res.status, data: data }; },
        function () { return { kind: 'unavailable', status: res.status, data: null }; });
    }, function () {
      return { kind: 'unavailable', status: 0, data: null };
    }).then(function (r) { if (timer) { clearTimeout(timer); } return r; });
  }

  function track(name, props) {
    if (root.AegisAnalytics && typeof root.AegisAnalytics.track === 'function') { root.AegisAnalytics.track(name, props || {}); }
  }

  // ------------------------------------------------------------------ form errors
  function describedBy(input, id, add) {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    var i = ids.indexOf(id);
    if (add && i === -1) { ids.push(id); }
    if (!add && i !== -1) { ids.splice(i, 1); }
    if (ids.length) { input.setAttribute('aria-describedby', ids.join(' ')); } else { input.removeAttribute('aria-describedby'); }
  }

  /** errors: [{id: inputOrFieldsetId, message}] — renders inline messages and a linked summary. */
  function showErrors(form, errors, summaryId) {
    var doc = form.ownerDocument;
    Array.prototype.forEach.call(form.querySelectorAll('.field-error'), function (p) { p.hidden = true; p.textContent = ''; });
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (i) {
      i.removeAttribute('aria-invalid');
      describedBy(i, i.id + '-error', false);
    });
    var summary = summaryId ? doc.getElementById(summaryId) : form.querySelector('.error-summary');
    if (!errors.length) { if (summary) { summary.hidden = true; } return; }
    errors.forEach(function (e) {
      var input = doc.getElementById(e.id);
      var msg = doc.getElementById(e.id + '-error');
      if (msg) { msg.textContent = e.message; msg.hidden = false; }
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        if (msg) { describedBy(input, msg.id, true); }
      }
    });
    if (summary) {
      var ul = summary.querySelector('ul');
      while (ul.firstChild) { ul.removeChild(ul.firstChild); }
      errors.forEach(function (e) {
        var li = doc.createElement('li');
        var a = doc.createElement('a');
        a.href = '#' + e.id;
        a.textContent = e.message;
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          var t = doc.getElementById(e.id);
          if (t) {
            var focusable = (t.tagName === 'FIELDSET') ? t.querySelector('input') : t;
            (focusable || t).focus();
          }
        });
        li.appendChild(a);
        ul.appendChild(li);
      });
      summary.hidden = false;
      summary.focus();
    }
  }

  function setStatus(el, message, kind) {
    if (!el) { return; }
    el.className = 'form-status' + (kind ? ' is-' + kind : '');
    el.textContent = message || '';
  }

  // ------------------------------------------------------------------ lead forms
  function fieldValue(form, name) {
    var el = form.elements[name];
    if (!el) { return ''; }
    if (el.type === 'checkbox') { return el.checked; }
    return String(el.value || '').trim();
  }

  function validateLeadForm(form, cfg) {
    var errors = [];
    var business = form.getAttribute('data-business-email') === 'true';
    Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (el) {
      if (el.type === 'hidden' || el.name === 'website' || !el.id) { return; }
      var label = form.querySelector('label[for="' + el.id + '"]');
      var name = label ? label.textContent.replace(/\(required\)/, '').replace(/See our privacy notice\./, '').trim() : el.name;
      if (el.type === 'checkbox') {
        if (el.required && !el.checked) { errors.push({ id: el.id, message: el.name === 'consent' ? 'Please confirm your consent to continue.' : 'Please tick: ' + name }); }
        return;
      }
      var v = String(el.value || '').trim();
      if (el.required && !v) { errors.push({ id: el.id, message: 'Enter your ' + name.toLowerCase() + '.' }); return; }
      if (el.type === 'email' && v) {
        if (!isValidEmail(v)) { errors.push({ id: el.id, message: 'Enter a valid email address, like name@company.com.' }); }
        else if (business && !isBusinessEmail(v, cfg.free_mail_domains)) {
          errors.push({ id: el.id, message: 'Please use your business email address (personal email domains are not accepted).' });
        }
      }
    });
    return errors;
  }

  function contactPayload(form) {
    var data = { form: form.getAttribute('data-aegis-form'), consent: true, website: fieldValue(form, 'website'),
      source: (root.location && root.location.pathname) || '' };
    ['email', 'name', 'company', 'role', 'message', 'ai_systems', 'industry', 'tool'].forEach(function (k) {
      var v = fieldValue(form, k);
      if (v) { data[k] = v; }
    });
    if (!data.tool && form.getAttribute('data-tool')) { data.tool = form.getAttribute('data-tool'); }
    return data;
  }

  function addDownload(statusEl, url, label) {
    var doc = statusEl.ownerDocument;
    var p = doc.createElement('p');
    var a = doc.createElement('a');
    a.className = 'btn btn-primary';
    a.href = url;
    a.setAttribute('download', '');
    a.setAttribute('data-cta', 'blueprint_download');
    a.textContent = label || 'Download';
    p.appendChild(a);
    statusEl.appendChild(p);
  }

  function initLeadForm(form, cfg, deps) {
    deps = deps || {};
    var post = deps.postJSON || postJSON;
    var statusEl = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var errors = validateLeadForm(form, cfg);
      showErrors(form, errors);
      if (errors.length) { return; }
      var payload = contactPayload(form);
      var formName = payload.form;
      var success = form.getAttribute('data-success') || 'Thank you. Your request has been received.';
      var download = form.getAttribute('data-download');
      var downloadLabel = form.getAttribute('data-download-label');
      if (payload.website) { // honeypot: pretend success, send nothing
        setStatus(statusEl, success, 'success');
        form.reset();
        return;
      }
      if (button) { button.disabled = true; }
      setStatus(statusEl, 'Sending…', '');
      post('/contact', payload, { config: cfg }).then(function (r) {
        if (button) { button.disabled = false; }
        if (r.kind === 'ok') {
          setStatus(statusEl, success, 'success');
          var dl = r.data && safeUrl(r.data.download_url, '/downloads/');
          if (formName === 'blueprint' && (dl || download)) { addDownload(statusEl, dl || download, downloadLabel); }
          form.reset();
          track('form_submit', { form: formName });
        } else if (r.kind === 'client_error') {
          var field = r.data && r.data.field;
          var msg = (r.data && r.data.error) || 'Please check the form and try again.';
          var target = field && form.elements[field] && form.elements[field].id;
          if (target) { showErrors(form, [{ id: target, message: msg }]); setStatus(statusEl, '', ''); }
          else { setStatus(statusEl, msg, 'error'); }
        } else {
          var contact = cfg.contact_email ? ' or email ' + cfg.contact_email : '';
          var text = r.kind === 'unavailable'
            ? 'We could not reach the AEGIS service, so your request has not been sent or stored. Please try again later' + contact + '.'
            : 'Something went wrong on our side and your request may not have been recorded. Please try again' + contact + '.';
          setStatus(statusEl, text, 'error');
          if (formName === 'blueprint' && download && r.kind === 'unavailable') {
            statusEl.appendChild(statusEl.ownerDocument.createTextNode(' You can still download the blueprint; your details were not recorded.'));
            addDownload(statusEl, download, downloadLabel);
          }
        }
        if (statusEl) { statusEl.focus(); }
      });
    });
  }

  // ------------------------------------------------------------------ navigation
  function initNav(doc) {
    var nav = doc.getElementById('site-nav');
    var toggle = doc.querySelector('.nav-toggle');
    if (!nav) { return; }
    var details = Array.prototype.slice.call(nav.querySelectorAll('details'));
    if (toggle) {
      doc.documentElement.classList.add('js-nav');
      toggle.hidden = false;
      toggle.addEventListener('click', function () {
        var open = !nav.classList.contains('is-open');
        nav.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    details.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) { details.forEach(function (o) { if (o !== d) { o.open = false; } }); }
      });
    });
    doc.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') { return; }
      var open = details.filter(function (d) { return d.open; });
      if (open.length) {
        open.forEach(function (d) { d.open = false; });
        var s = open[0].querySelector('summary');
        if (s) { s.focus(); }
      } else if (toggle && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    doc.addEventListener('click', function (ev) {
      if (!nav.contains(ev.target)) { details.forEach(function (d) { d.open = false; }); }
    });
  }

  function init(doc) {
    var cfg = readConfig(doc);
    initNav(doc);
    Array.prototype.forEach.call(doc.querySelectorAll('form[data-aegis-form]'), function (f) { initLeadForm(f, cfg); });
  }

  return {
    init: init, readConfig: readConfig, isValidEmail: isValidEmail, isBusinessEmail: isBusinessEmail,
    emailDomain: emailDomain, safeUrl: safeUrl, classify: classify, postJSON: postJSON, showErrors: showErrors,
    setStatus: setStatus, validateLeadForm: validateLeadForm, contactPayload: contactPayload, initLeadForm: initLeadForm,
    track: track
  };
}));
