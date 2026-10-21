/*
 * AEGIS Maturity Self-Assessment — detailed report rendering (DOM + Markdown).
 *
 * renderReport(doc, container, result, opts) builds the report with DOM APIs only
 * (textContent, never innerHTML), so no answer, name or server string can inject markup.
 * toMarkdown(result, opts) mirrors aegis_reports.maturity.render_maturity_markdown for the
 * offline "Download Markdown" path. The internal lead qualification (result.lead) is never
 * rendered.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.AegisReport = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var INDICATIVE = 'Indicative — not a compliance determination';

  function fixed1(n) { return Number(n).toFixed(1); }

  function roundHalfEven(x) {
    var f = Math.floor(x), d = x - f;
    if (d > 0.5) { return f + 1; }
    if (d < 0.5) { return f; }
    return (f % 2 === 0) ? f : f + 1;
  }

  function bar(score, width) {
    width = width || 20;
    var filled = roundHalfEven(score / 100 * width);
    return '`[' + new Array(filled + 1).join('#') + new Array(width - filled + 1).join('.') + ']`';
  }

  function controlUrl(base, id) { return (base || '/framework/controls/') + String(id).toLowerCase() + '/'; }

  function mdCell(s) { return String(s === undefined || s === null ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' '); }

  function citation(bundle, id) {
    var c = bundle && bundle.controls && bundle.controls[id];
    if (!c) { return null; }
    return 'AEGIS Control ' + id + ': ' + c.title + ' (Control Library v' + bundle.control_library_version + ')';
  }

  /** Markdown report (offline fallback). opts: {bundle, company, generated} */
  function toMarkdown(result, opts) {
    opts = opts || {};
    var bundle = opts.bundle || {};
    var tpl = bundle.template || { template: { name: 'AI Governance Maturity Self-Assessment' }, questions: [], scale: [] };
    var qtext = {};
    (tpl.questions || []).forEach(function (q) { qtext[q.id] = q.text; });
    var scale = {};
    (tpl.scale || []).forEach(function (s) { scale[s.score] = s.label; });
    var org = opts.company || 'Your organization';
    var gen = opts.generated || new Date().toISOString().slice(0, 10);
    var L = [];
    L.push('# AI Governance Maturity Report — ' + org, '');
    L.push('**Assessment:** ' + tpl.template.name + ' (template ' + result.template_id + ' v' + result.template_version + ')  ');
    L.push('**Generated:** ' + gen + ' (in your browser; not stored by AEGIS)  ');
    L.push('**Evidence status:** ' + result.evidence_status + ' — all answers are self-reported; no evidence has been reviewed.', '');
    L.push('> ' + result.disclaimer, '');
    L.push('## 1. Overall maturity', '', '| Overall score | Maturity level | Interpretation |', '|---|---|---|');
    L.push('| **' + fixed1(result.overall_score) + ' / 100** | **' + result.maturity_level + '** | ' + mdCell(result.level_interpretation) + ' |', '');
    L.push('## 2. Domain scores', '', '| Domain | Weight | Score | Profile |', '|---|---|---|---|');
    result.domains.forEach(function (d) {
      L.push('| ' + mdCell(d.name) + ' | ' + d.weight + '% | ' + fixed1(d.score) + ' | ' + bar(d.score) + ' |');
    });
    L.push('', 'Scoring: domain score = sum of answers ÷ maximum possible × 100; overall = Σ(domain score × weight). Source: AEGIS self-assessment template ' + result.template_id + ' v' + result.template_version + '.', '');
    L.push('## 3. Top strengths', '');
    if (result.strengths.length) {
      result.strengths.forEach(function (s) {
        L.push('- **' + s.domain + '** — ' + s.text + ' (answer ' + s.score + '/5; question ' + s.question_id + '; controls ' + s.controls.join(', ') + ') — *User-asserted*');
      });
    } else {
      L.push('- No practices were rated 4 or 5. Strengths will emerge as foundational controls are implemented.');
    }
    L.push('', '## 4. Top gaps', '');
    if (result.gaps.length) {
      L.push('| # | Domain | Question | Answer | Recommended action | AEGIS controls |', '|---|---|---|---|---|---|');
      result.gaps.forEach(function (g, i) {
        L.push('| ' + (i + 1) + ' | ' + mdCell(g.domain) + ' | ' + g.question_id + ': ' + mdCell(g.text) + ' | ' + g.score + '/5 | ' + mdCell(g.action) + ' | ' + g.controls.join(', ') + ' |');
      });
    } else {
      L.push('- No questions were rated 3 or lower.');
    }
    L.push('', '## 5. Critical risk flags', '');
    if (result.critical_flags.length) {
      result.critical_flags.forEach(function (f) {
        L.push('- **' + f.severity + ' — ' + f.title + '** (trigger: ' + f.question_id + '). ' + f.rationale + ' Controls: ' + f.controls.join(', ') + '. Evidence status: User-asserted.');
      });
    } else {
      L.push('- No critical risk flags were triggered by your answers.');
    }
    L.push('', '## 6. 30/60/90-day action plan', '');
    var labels = result.action_plan_labels || {};
    ['30', '60', '90'].forEach(function (h) {
      L.push('### ' + (labels[h] || (h + ' days')), '');
      var items = result.action_plan[h] || [];
      if (!items.length) { L.push('- No actions in this horizon based on your answers.'); }
      items.forEach(function (it) {
        L.push('- ' + it.action + ' (' + it.domain + '; ' + it.question_id + '; controls ' + it.controls.join(', ') + ')');
      });
      L.push('');
    });
    L.push('## 7. Recommended AEGIS controls', '', '| Control | Pillar | Priority | NIST AI RMF | ISO/IEC 42001 | EU AI Act |', '|---|---|---|---|---|---|');
    result.recommended_controls.forEach(function (c) {
      var m = c.mappings || {};
      function j(k) { return (m[k] && m[k].length) ? m[k].join(', ') : '—'; }
      L.push('| **' + c.id + '** ' + mdCell(c.title) + ' | ' + c.pillar + ' | ' + c.priority + ' | ' + j('nist_ai_rmf') + ' | ' + j('iso_42001') + ' | ' + j('eu_ai_act') + ' |');
    });
    L.push('', 'Framework mappings are indicative AEGIS interpretations (Control Library v' + (bundle.control_library_version || '') + ').', '');
    L.push('## 8. Framework readiness indicators (indicative — not a compliance determination)', '');
    result.readiness.forEach(function (fw) {
      L.push('### ' + fw.framework, '', '| Area | Indicator | Band | Based on questions |', '|---|---|---|---|');
      fw.groups.forEach(function (g) {
        L.push('| ' + mdCell(g.name) + ' | ' + fixed1(g.value) + ' | ' + g.band + ' | ' + g.questions.join(', ') + ' |');
      });
      L.push('');
    });
    L.push('These indicators summarise self-reported practices that relate to each framework area. They do not indicate conformity with ISO/IEC 42001, compliance with the EU AI Act, or alignment with NIST AI RMF, and EU AI Act applicability depends on your role (provider/deployer) and system classification.', '');
    L.push('## 9. Recommended AEGIS modules', '');
    result.recommended_modules.forEach(function (m) { L.push('- **AEGIS ' + m.module + '** — ' + m.reason); });
    L.push('');
    var cta = result.cta.primary;
    L.push('## 10. Next step: AEGIS Governance Baseline', '', cta.description, '', '**' + cta.label + ':** ' + cta.url, '', '---', '');
    L.push('### Appendix A — Your answers', '', '| Question | Answer |', '|---|---|');
    result.domains.forEach(function (d) {
      Object.keys(d.answers || {}).forEach(function (qid) {
        var v = d.answers[qid];
        L.push('| ' + qid + ': ' + mdCell(qtext[qid] || '') + ' | ' + v + ' — ' + (scale[v] || '') + ' |');
      });
    });
    L.push('', '### Appendix B — Sources', '');
    var cited = result.recommended_controls.map(function (c) { return c.id; });
    result.critical_flags.forEach(function (f) { f.controls.forEach(function (x) { if (cited.indexOf(x) === -1) { cited.push(x); } }); });
    cited.forEach(function (cid) { var c = citation(bundle, cid); if (c) { L.push('- ' + c); } });
    L.push('- AEGIS Self-Assessment template ' + result.template_id + ' v' + result.template_version, '');
    L.push('*' + result.standard_disclaimer + '*', '');
    return L.join('\n');
  }

  // ------------------------------------------------------------------ DOM rendering
  function el(doc, tag, attrs, children) {
    var e = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'text') { e.textContent = attrs[k]; }
        else if (k === 'className') { e.className = attrs[k]; }
        else { e.setAttribute(k, attrs[k]); }
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) { return; }
      e.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c);
    });
    return e;
  }

  function controlLinks(doc, ids, base) {
    var span = el(doc, 'span', { className: 'cite' }, ['AEGIS controls: ']);
    ids.forEach(function (id, i) {
      if (i) { span.appendChild(doc.createTextNode(', ')); }
      span.appendChild(el(doc, 'a', { href: controlUrl(base, id), text: id }));
    });
    return span;
  }

  function badge(doc, label) {
    var cls = { 'User-asserted': 'badge-asserted', 'Critical gap': 'badge-critical', 'Inferred': 'badge-inferred',
      'Verified': 'badge-verified', 'Missing evidence': 'badge-missing' }[label] || 'badge-missing';
    return el(doc, 'span', { className: 'badge ' + cls, text: label });
  }

  function section(doc, id, title) {
    var s = el(doc, 'section', { className: 'report-section', 'aria-labelledby': id });
    s.appendChild(el(doc, 'h3', { id: id, text: title }));
    return s;
  }

  function domainBars(doc, domains, idPrefix) {
    var ul = el(doc, 'ul', { className: 'domain-bars' });
    domains.forEach(function (d) {
      var lid = idPrefix + '-' + d.id;
      var li = el(doc, 'li', { className: 'domain-bar' }, [
        el(doc, 'span', { id: lid, text: d.name }),
        el(doc, 'span', { className: 'domain-bar-score', text: fixed1(d.score) }),
        el(doc, 'progress', { max: '100', value: String(d.score), 'aria-labelledby': lid })
      ]);
      ul.appendChild(li);
    });
    return ul;
  }

  /** opts: {bundle, company, generated} */
  function renderReport(doc, container, result, opts) {
    opts = opts || {};
    var base = (opts.bundle && opts.bundle.control_url_base) || '/framework/controls/';
    while (container.firstChild) { container.removeChild(container.firstChild); }
    var org = opts.company || 'Your organization';
    container.appendChild(el(doc, 'h2', { id: 'report-title', tabindex: '-1', text: 'AI Governance Maturity Report — ' + org }));
    container.appendChild(el(doc, 'p', { className: 'evidence-note' }, [badge(doc, result.evidence_status),
      ' All findings are based on self-reported answers. No evidence has been reviewed. Template ' + result.template_id + ' v' + result.template_version + '.']));
    container.appendChild(el(doc, 'aside', { className: 'disclaimer', 'aria-label': 'Assessment disclaimer' }, [el(doc, 'p', { text: result.disclaimer })]));

    var s1 = section(doc, 'rpt-overall', 'Overall maturity');
    s1.appendChild(el(doc, 'div', { className: 'score-summary' }, [
      el(doc, 'p', { className: 'score-big' }, [fixed1(result.overall_score), el(doc, 'span', { className: 'score-max', text: ' / 100' })]),
      el(doc, 'p', { className: 'score-level' }, ['Maturity level: ', el(doc, 'strong', { text: result.maturity_level })]),
      el(doc, 'p', { text: result.level_interpretation })
    ]));
    container.appendChild(s1);

    var s2 = section(doc, 'rpt-domains', 'Domain scores');
    s2.appendChild(domainBars(doc, result.domains, 'rpt-d'));
    container.appendChild(s2);

    var s3 = section(doc, 'rpt-flags', 'Critical risk flags');
    if (!result.critical_flags.length) {
      s3.appendChild(el(doc, 'p', { text: 'No critical risk flags were triggered by your answers.' }));
    }
    result.critical_flags.forEach(function (f) {
      s3.appendChild(el(doc, 'div', { className: 'flag' }, [
        el(doc, 'h4', {}, [badge(doc, f.severity), ' ' + f.title]),
        el(doc, 'p', { text: f.rationale }),
        el(doc, 'p', {}, [controlLinks(doc, f.controls, base), el(doc, 'span', { className: 'cite', text: ' · Trigger: ' + f.question_id + ' · Evidence status: User-asserted' })])
      ]));
    });
    container.appendChild(s3);

    var s4 = section(doc, 'rpt-gaps', 'Top gaps');
    if (!result.gaps.length) { s4.appendChild(el(doc, 'p', { text: 'No questions were rated 3 or lower.' })); }
    var ol = el(doc, 'ol');
    result.gaps.forEach(function (g) {
      ol.appendChild(el(doc, 'li', {}, [
        el(doc, 'strong', { text: g.domain + ': ' }), g.text + ' ',
        el(doc, 'span', { className: 'cite', text: '(' + g.question_id + ', answer ' + g.score + '/5)' }),
        el(doc, 'br'), 'Recommended action: ' + g.action + ' ', el(doc, 'br'), controlLinks(doc, g.controls, base)
      ]));
    });
    if (result.gaps.length) { s4.appendChild(ol); }
    container.appendChild(s4);

    var s5 = section(doc, 'rpt-strengths', 'Top strengths');
    if (!result.strengths.length) {
      s5.appendChild(el(doc, 'p', { text: 'No practices were rated 4 or 5. Strengths will emerge as foundational controls are implemented.' }));
    } else {
      var ul5 = el(doc, 'ul');
      result.strengths.forEach(function (s) {
        ul5.appendChild(el(doc, 'li', {}, [el(doc, 'strong', { text: s.domain + ': ' }), s.text + ' ',
          el(doc, 'span', { className: 'cite', text: '(' + s.question_id + ', answer ' + s.score + '/5) ' }), badge(doc, 'User-asserted'), ' ',
          controlLinks(doc, s.controls, base)]));
      });
      s5.appendChild(ul5);
    }
    container.appendChild(s5);

    var s6 = section(doc, 'rpt-plan', '30/60/90-day action plan');
    var grid = el(doc, 'div', { className: 'plan-grid' });
    var labels = result.action_plan_labels || {};
    ['30', '60', '90'].forEach(function (h) {
      var col = el(doc, 'div', { className: 'plan-col' }, [el(doc, 'h4', { text: labels[h] || (h + ' days') })]);
      var items = result.action_plan[h] || [];
      if (!items.length) { col.appendChild(el(doc, 'p', { className: 'small', text: 'No actions in this horizon based on your answers.' })); }
      var u = el(doc, 'ul');
      items.forEach(function (it) {
        u.appendChild(el(doc, 'li', {}, [it.action + ' ', el(doc, 'br'),
          el(doc, 'span', { className: 'cite', text: it.domain + ' · ' + it.question_id + ' · ' }), controlLinks(doc, it.controls, base)]));
      });
      if (items.length) { col.appendChild(u); }
      grid.appendChild(col);
    });
    s6.appendChild(grid);
    container.appendChild(s6);

    var s7 = section(doc, 'rpt-controls', 'Recommended AEGIS controls');
    var wrap = el(doc, 'div', { className: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': 'Recommended controls' });
    var table = el(doc, 'table');
    table.appendChild(el(doc, 'thead', {}, [el(doc, 'tr', {}, ['Control', 'Pillar', 'Priority', 'NIST AI RMF', 'ISO/IEC 42001', 'EU AI Act'].map(function (h) {
      return el(doc, 'th', { scope: 'col', text: h });
    }))]));
    var tb = el(doc, 'tbody');
    result.recommended_controls.forEach(function (c) {
      var m = c.mappings || {};
      function j(k) { return (m[k] && m[k].length) ? m[k].join(', ') : '—'; }
      tb.appendChild(el(doc, 'tr', {}, [
        el(doc, 'th', { scope: 'row' }, [el(doc, 'a', { href: controlUrl(base, c.id) }, [el(doc, 'span', { className: 'control-id', text: c.id }), ' ' + c.title])]),
        el(doc, 'td', { text: c.pillar }), el(doc, 'td', { text: c.priority }),
        el(doc, 'td', { text: j('nist_ai_rmf') }), el(doc, 'td', { text: j('iso_42001') }), el(doc, 'td', { text: j('eu_ai_act') })
      ]));
    });
    table.appendChild(tb);
    wrap.appendChild(table);
    s7.appendChild(wrap);
    s7.appendChild(el(doc, 'p', { className: 'small', text: 'Framework mappings are indicative AEGIS interpretations, not legal advice or an official crosswalk.' }));
    container.appendChild(s7);

    var s8 = section(doc, 'rpt-readiness', 'Framework readiness indicators');
    s8.appendChild(el(doc, 'p', {}, [el(doc, 'strong', { text: INDICATIVE + '. ' }),
      'These indicators summarise self-reported practices related to each framework area. They do not indicate conformity with ISO/IEC 42001, compliance with the EU AI Act, or alignment with NIST AI RMF.']));
    result.readiness.forEach(function (fw, i) {
      s8.appendChild(el(doc, 'h4', { text: fw.framework + ' (indicative)' }));
      var w = el(doc, 'div', { className: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': fw.framework + ' readiness indicators' });
      var t = el(doc, 'table');
      t.appendChild(el(doc, 'thead', {}, [el(doc, 'tr', {}, ['Area', 'Indicator', 'Band', 'Based on questions'].map(function (h) {
        return el(doc, 'th', { scope: 'col', text: h });
      }))]));
      var b = el(doc, 'tbody');
      fw.groups.forEach(function (g) {
        b.appendChild(el(doc, 'tr', {}, [el(doc, 'th', { scope: 'row', text: g.name }), el(doc, 'td', { text: fixed1(g.value) }),
          el(doc, 'td', { text: g.band }), el(doc, 'td', { text: g.questions.join(', ') })]));
      });
      t.appendChild(b);
      w.appendChild(t);
      s8.appendChild(w);
    });
    container.appendChild(s8);

    var s9 = section(doc, 'rpt-modules', 'Recommended AEGIS modules');
    var ul9 = el(doc, 'ul');
    result.recommended_modules.forEach(function (m) {
      ul9.appendChild(el(doc, 'li', {}, [el(doc, 'strong', { text: 'AEGIS ' + m.module }), ' — ' + m.reason]));
    });
    s9.appendChild(ul9);
    container.appendChild(s9);

    var cta = result.cta.primary;
    var s10 = section(doc, 'rpt-next', 'Next step: validate with evidence');
    s10.appendChild(el(doc, 'p', { text: cta.description }));
    s10.appendChild(el(doc, 'p', {}, [el(doc, 'a', { className: 'btn btn-primary', href: cta.url, 'data-cta': 'report_baseline', text: cta.label })]));
    if (result.cta.secondary) {
      s10.appendChild(el(doc, 'p', {}, [el(doc, 'a', { href: result.cta.secondary.url, 'data-cta': 'report_agent', text: result.cta.secondary.label })]));
    }
    container.appendChild(s10);
    container.appendChild(el(doc, 'aside', { className: 'disclaimer', 'aria-label': 'Disclaimer' }, [el(doc, 'p', { text: result.standard_disclaimer })]));
    return container;
  }

  return { toMarkdown: toMarkdown, renderReport: renderReport, domainBars: domainBars, controlUrl: controlUrl, INDICATIVE: INDICATIVE };
}));
