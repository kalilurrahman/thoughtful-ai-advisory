/*
 * AEGIS privacy-friendly analytics (cookieless, no identifiers, no personal data).
 *  - Sends {name, path, props} to /api/events with navigator.sendBeacon (text/plain).
 *  - Does nothing when Do Not Track or Global Privacy Control is enabled.
 *  - path is location.pathname only (no query string or fragment, which can carry tokens).
 *  - props are limited to short scalar values; anything that looks like an email is dropped.
 */
(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else {
    root.AegisAnalytics = api;
    if (root.document) {
      if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', function () { api.init(root); }); }
      else { api.init(root); }
    }
  }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var EVENTS = ['page_view', 'cta_click', 'assessment_start', 'assessment_step', 'assessment_preliminary',
    'assessment_gate_view', 'assessment_lead_submitted', 'assessment_report_download', 'form_submit',
    'tool_use', 'outbound_click'];
  var BLOCKED_KEY = /(email|name|phone|company|message|address|ip|user)/i;
  var EMAIL_LIKE = /[^\s@]+@[^\s@]+/;

  function trackingAllowed(env) {
    env = env || root;
    var nav = env.navigator || {};
    var dnt = nav.doNotTrack || env.doNotTrack || nav.msDoNotTrack;
    if (dnt === '1' || dnt === 'yes' || dnt === 1) { return false; }
    if (nav.globalPrivacyControl === true || nav.globalPrivacyControl === '1') { return false; }
    return true;
  }

  function sanitizeProps(props) {
    var out = {};
    if (!props || typeof props !== 'object') { return out; }
    var keys = Object.keys(props).slice(0, 10);
    keys.forEach(function (k) {
      var v = props[k];
      if (BLOCKED_KEY.test(k)) { return; }
      if (typeof v === 'number' || typeof v === 'boolean') { out[String(k).slice(0, 40)] = v; return; }
      if (typeof v === 'string') {
        if (EMAIL_LIKE.test(v)) { return; }
        out[String(k).slice(0, 40)] = v.slice(0, 120);
      }
    });
    return out;
  }

  function buildEvent(name, props, env) {
    env = env || root;
    var path = (env.location && env.location.pathname) || '/';
    return { name: name, path: String(path).slice(0, 200), props: sanitizeProps(props) };
  }

  function makeTracker(env, endpoint) {
    env = env || root;
    endpoint = endpoint || '/api/events';
    return function track(name, props) {
      if (EVENTS.indexOf(name) === -1 || !trackingAllowed(env)) { return false; }
      var body = JSON.stringify(buildEvent(name, props, env));
      var nav = env.navigator || {};
      try {
        if (typeof nav.sendBeacon === 'function') { return nav.sendBeacon(endpoint, body); }
        if (typeof env.fetch === 'function') {
          env.fetch(endpoint, { method: 'POST', body: body, keepalive: true, credentials: 'omit',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }).catch(function () {});
          return true;
        }
      } catch (e) { /* analytics must never break the page */ }
      return false;
    };
  }

  var api = { EVENTS: EVENTS, trackingAllowed: trackingAllowed, sanitizeProps: sanitizeProps, buildEvent: buildEvent,
    makeTracker: makeTracker, track: function () { return false; } };

  api.init = function (env) {
    var doc = env.document;
    var base = '/api';
    try {
      var cfgEl = doc.getElementById('aegis-config');
      if (cfgEl) { base = (JSON.parse(cfgEl.textContent).api_base || '/api').replace(/\/$/, ''); }
    } catch (e) { /* default */ }
    api.track = makeTracker(env, base + '/events');
    api.track('page_view', {});
    doc.addEventListener('click', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest('a, button') : null;
      if (!t) { return; }
      var cta = t.getAttribute('data-cta');
      if (cta) { api.track('cta_click', { cta: cta }); return; }
      if (t.tagName === 'A' && /^https?:/i.test(t.href || '') && env.location && t.host !== env.location.host) {
        api.track('outbound_click', { host: t.host });
      }
    }, true);
  };

  return api;
}));
