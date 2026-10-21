/*
 * Shared helpers for AEGIS interactive tools (guardrail generator, Ask AEGIS, risk triage).
 * DOM is built with createElement/textContent only. renderMarkdown() is a deliberately small,
 * safe Markdown subset (headings, paragraphs, lists, bold/italic/code, links, pipe tables):
 * it never uses innerHTML and only allows http(s), mailto and same-site links.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.AegisTools = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CONTROL_ID = /\b(AO|EI|GL|IS|SE)-\d{2}\b/;

  function el(doc, tag, attrs, children) {
    var e = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] === null || attrs[k] === undefined) { return; }
        if (k === 'text') { e.textContent = String(attrs[k]); }
        else if (k === 'className') { e.className = attrs[k]; }
        else { e.setAttribute(k, attrs[k]); }
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) { return; }
      e.appendChild(typeof c === 'string' || typeof c === 'number' ? doc.createTextNode(String(c)) : c);
    });
    return e;
  }

  function linkHref(url) {
    var u = String(url || '').trim();
    if (/^(https?:|mailto:)/i.test(u)) { return u; }
    if (/^\/(?!\/)/.test(u) || /^#/.test(u)) { return u; }
    return null;
  }

  function controlHref(id) { return '/framework/controls/' + String(id).toLowerCase() + '/'; }

  var BADGES = { 'User-asserted': 'badge-asserted', 'Critical gap': 'badge-critical', 'Inferred': 'badge-inferred',
    'Verified': 'badge-verified', 'Missing evidence': 'badge-missing' };

  function badge(doc, label) {
    return el(doc, 'span', { className: 'badge ' + (BADGES[label] || 'badge-missing'), text: label });
  }

  /** Inline Markdown: **bold**, *italic*, `code`, [text](url); evidence labels become badges. */
  function inline(doc, text) {
    var frag = doc.createDocumentFragment();
    var re = /(\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
    var last = 0, m;
    var s = String(text || '');
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) { frag.appendChild(doc.createTextNode(s.slice(last, m.index))); }
      if (m[2] !== undefined) { frag.appendChild(el(doc, 'strong', {}, [inline(doc, m[2])])); }
      else if (m[3] !== undefined || m[4] !== undefined) {
        var t = m[3] !== undefined ? m[3] : m[4];
        frag.appendChild(BADGES[t] ? badge(doc, t) : el(doc, 'em', { text: t }));
      } else if (m[5] !== undefined) { frag.appendChild(el(doc, 'code', { text: m[5] })); }
      else {
        var href = linkHref(m[7]);
        frag.appendChild(href ? el(doc, 'a', { href: href, rel: /^https?:/i.test(href) ? 'noopener noreferrer' : null, text: m[6] }) : doc.createTextNode(m[6]));
      }
      last = re.lastIndex;
    }
    if (last < s.length) { frag.appendChild(doc.createTextNode(s.slice(last))); }
    return frag;
  }

  function splitRow(line) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(function (c) { return c.trim().replace(/\\\|/g, '|'); });
  }

  /** Block Markdown subset -> DocumentFragment. headingBase: level for '#' (default 3). */
  function renderMarkdown(doc, md, headingBase) {
    headingBase = headingBase || 3;
    var frag = doc.createDocumentFragment();
    var lines = String(md || '').replace(/\r\n?/g, '\n').split('\n');
    var i = 0, para = [];
    function flush() { if (para.length) { frag.appendChild(el(doc, 'p', {}, [inline(doc, para.join(' '))])); para = []; } }
    while (i < lines.length) {
      var line = lines[i];
      var h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (!line.trim()) { flush(); i++; continue; }
      if (/^```/.test(line)) {
        flush();
        var code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        frag.appendChild(el(doc, 'pre', { tabindex: '0' }, [el(doc, 'code', { text: code.join('\n') })]));
        continue;
      }
      if (h) {
        flush();
        frag.appendChild(el(doc, 'h' + Math.min(6, headingBase + h[1].length - 1), {}, [inline(doc, h[2])]));
        i++; continue;
      }
      if (/^\s*([-*]|\d+[.)])\s+/.test(line)) {
        flush();
        var ordered = /^\s*\d+[.)]\s+/.test(line);
        var list = el(doc, ordered ? 'ol' : 'ul');
        while (i < lines.length && /^\s*([-*]|\d+[.)])\s+/.test(lines[i])) {
          list.appendChild(el(doc, 'li', {}, [inline(doc, lines[i].replace(/^\s*([-*]|\d+[.)])\s+/, ''))]));
          i++;
        }
        frag.appendChild(list);
        continue;
      }
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
        flush();
        var head = splitRow(line);
        i += 2;
        var table = el(doc, 'table');
        table.appendChild(el(doc, 'thead', {}, [el(doc, 'tr', {}, head.map(function (c) { return el(doc, 'th', { scope: 'col' }, [inline(doc, c)]); }))]));
        var tb = el(doc, 'tbody');
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          tb.appendChild(el(doc, 'tr', {}, splitRow(lines[i]).map(function (c) { return el(doc, 'td', {}, [inline(doc, c)]); })));
          i++;
        }
        table.appendChild(tb);
        frag.appendChild(el(doc, 'div', { className: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': 'Table' }, [table]));
        continue;
      }
      if (/^>\s?/.test(line)) { flush(); frag.appendChild(el(doc, 'blockquote', {}, [inline(doc, line.replace(/^>\s?/, ''))])); i++; continue; }
      if (/^-{3,}\s*$/.test(line)) { flush(); frag.appendChild(el(doc, 'hr')); i++; continue; }
      para.push(line.trim());
      i++;
    }
    flush();
    return frag;
  }

  function controlLinks(doc, ids, label) {
    var p = el(doc, 'p', { className: 'cite' }, [label || 'AEGIS controls cited: ']);
    var list = (ids || []).filter(function (x) { return CONTROL_ID.test(String(x)); });
    if (!list.length) { p.appendChild(doc.createTextNode('No supporting evidence or framework source is available.')); return p; }
    list.forEach(function (id, i) {
      if (i) { p.appendChild(doc.createTextNode(', ')); }
      p.appendChild(el(doc, 'a', { href: controlHref(id), text: id }));
    });
    return p;
  }

  function kv(doc, pairs) {
    var dl = el(doc, 'dl', { className: 'kv' });
    pairs.forEach(function (p) {
      if (p[1] === null || p[1] === undefined || p[1] === '') { return; }
      dl.appendChild(el(doc, 'dt', { text: p[0] }));
      dl.appendChild(el(doc, 'dd', {}, [typeof p[1] === 'object' && p[1].nodeType ? p[1] : String(p[1])]));
    });
    return dl;
  }

  function table(doc, label, headers, rows) {
    var t = el(doc, 'table');
    t.appendChild(el(doc, 'thead', {}, [el(doc, 'tr', {}, headers.map(function (h) { return el(doc, 'th', { scope: 'col', text: h }); }))]));
    var tb = el(doc, 'tbody');
    rows.forEach(function (r) {
      tb.appendChild(el(doc, 'tr', {}, r.map(function (c, i) {
        var cell = el(doc, i === 0 ? 'th' : 'td', i === 0 ? { scope: 'row' } : {});
        if (c && c.nodeType) { cell.appendChild(c); } else { cell.textContent = (c === null || c === undefined) ? '' : String(c); }
        return cell;
      })));
    });
    t.appendChild(tb);
    return el(doc, 'div', { className: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': label }, [t]);
  }

  /** Read named controls of a tool form into a plain object (empty values omitted). */
  function readForm(form) {
    var out = {};
    Array.prototype.forEach.call(form.querySelectorAll('input[name], select[name], textarea[name]'), function (e) {
      var v = String(e.value || '').trim();
      if (v) { out[e.name] = v; }
    });
    return out;
  }

  function splitList(v) {
    return String(v || '').split(/[,;\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /** "crm_lookup:read\nissue_refund:payment" -> [{name, operation?}] */
  function parseTools(text) {
    return String(text || '').split(/\n|;/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var m = /^([^:]+?)\s*:\s*([A-Za-z_]+)\s*$/.exec(l);
      return m ? { name: m[1].trim(), operation: m[2].trim().toLowerCase() } : { name: l };
    });
  }

  function yesNo(v) { return v === 'yes' ? true : v === 'no' ? false : undefined; }

  /** Show the "service unavailable" panel inside a tool section. */
  function showUnavailable(section, message) {
    var panel = section.querySelector('.tool-unavailable');
    if (!panel) { return; }
    if (message) { panel.querySelector('.tool-unavailable-msg').textContent = message; }
    panel.hidden = false;
    var h = panel.querySelector('h3');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }

  function hideUnavailable(section) {
    var panel = section.querySelector('.tool-unavailable');
    if (panel) { panel.hidden = true; }
  }

  function downloadText(doc, text, filename, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = doc.createElement('a');
    a.href = url;
    a.download = filename;
    doc.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  function copyText(win, text) {
    if (win.navigator && win.navigator.clipboard && win.navigator.clipboard.writeText) {
      return win.navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
    }
    return Promise.resolve(false);
  }

  return { el: el, badge: badge, inline: inline, renderMarkdown: renderMarkdown, controlLinks: controlLinks,
    controlHref: controlHref, kv: kv, table: table, readForm: readForm, splitList: splitList, parseTools: parseTools,
    yesNo: yesNo, showUnavailable: showUnavailable, hideUnavailable: hideUnavailable, downloadText: downloadText,
    copyText: copyText, linkHref: linkHref };
}));
