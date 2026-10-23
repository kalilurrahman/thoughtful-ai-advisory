/* VERITRAIL risk triage: form -> POST /api/risk-tier -> preliminary (Inferred) tier with factors and citations. */
(function () {
  'use strict';
  var doc = document;
  var section = doc.getElementById('risk-triage');
  if (!section || !window.VERITRAIL || !window.VeritrailTools) { return; }
  var A = window.VERITRAIL, T = window.VeritrailTools, el = T.el;
  var cfg = A.readConfig(doc);
  var form = doc.getElementById('rt-form');
  var status = doc.getElementById('rt-status');
  var result = doc.getElementById('rt-result');
  var out = section.querySelector('.rt-output');

  function buildProfile(v) {
    var p = {};
    ['name', 'purpose', 'decision_impact', 'affected_parties', 'data_sensitivity', 'autonomy', 'domain_category', 'environment']
      .forEach(function (k) { if (v[k]) { p[k] = v[k]; } });
    if (v.tools) { p.tools = T.splitList(v.tools); }
    ['external_actions', 'eu_exposure', 'vendor_model', 'genai'].forEach(function (k) {
      var b = T.yesNo(v[k]);
      if (b !== undefined) { p[k] = b; }
    });
    return p;
  }

  function render(d) {
    while (out.firstChild) { out.removeChild(out.firstChild); }
    out.appendChild(el(doc, 'p', {}, ['Preliminary tier: ', el(doc, 'strong', { className: 'tier', text: d.tier }), ' ',
      T.badge(doc, d.evidence_status || 'Inferred'), d.provisional ? ' (provisional — key facts missing)' : '']));
    out.appendChild(el(doc, 'p', { className: 'notice notice--warning', text: 'This tier is preliminary and inferred from your answers. It requires confirmation by an accountable approver; changing a confirmed tier requires human approval.' }));
    out.appendChild(T.kv(doc, [['Score', d.score], ['Approval authority', d.approval_authority],
      ['Review cadence', d.review_cadence_months ? 'Every ' + d.review_cadence_months + ' months' : 'Not applicable — do not proceed without legal review'],
      ['Required assessment modules', (d.required_modules || []).join(', ')]]));
    if ((d.triggers || []).length) {
      out.appendChild(el(doc, 'h3', { text: 'Triggers' }));
      var tu = el(doc, 'ul');
      d.triggers.forEach(function (t) { tu.appendChild(el(doc, 'li', { text: t })); });
      out.appendChild(tu);
    }
    if ((d.factors || []).length) {
      out.appendChild(el(doc, 'h3', { text: 'Scoring factors' }));
      out.appendChild(T.table(doc, 'Scoring factors', ['Factor', 'Value', 'Points', 'Citation'], d.factors.map(function (f) {
        return [String(f.factor).replace(/_/g, ' '), String(f.value), '+' + f.points, f.citation];
      })));
    }
    if ((d.missing_fields || []).length) {
      out.appendChild(el(doc, 'h3', { text: 'Missing information' }));
      var mu = el(doc, 'ul');
      (d.clarifying_questions || d.missing_fields).forEach(function (q) { mu.appendChild(el(doc, 'li', {}, [T.badge(doc, 'Missing evidence'), ' ' + q])); });
      out.appendChild(mu);
    }
    out.appendChild(el(doc, 'h3', { text: 'Rationale' }));
    out.appendChild(el(doc, 'p', { text: d.rationale || '' }));
    out.appendChild(T.controlLinks(doc, d.citation_ids || [], 'VERITRAIL controls cited: '));
    if (d.method) { out.appendChild(el(doc, 'p', { className: 'small', text: 'Method: ' + d.method + '. EU AI Act category screens are indicative triggers for legal review, not a legal classification.' })); }
    result.hidden = false;
    result.focus();
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var v = T.readForm(form);
    var errs = v.name ? [] : [{ id: 'rt-name', message: 'Enter a name for the AI system or use case.' }];
    A.showErrors(form, errs, null);
    if (errs.length) { doc.getElementById('rt-name').focus(); return; }
    T.hideUnavailable(section);
    A.setStatus(status, 'Calculating…', '');
    A.postJSON('/risk-tier', { profile: buildProfile(v) }, { config: cfg }).then(function (r) {
      A.setStatus(status, '', '');
      if (r.kind === 'ok' && r.data && r.data.tier) {
        A.track('tool_use', { tool: 'risk-triage', tier: r.data.tier });
        render(r.data);
      } else if (r.kind === 'client_error') {
        A.setStatus(status, (r.data && r.data.error) || 'Please check your inputs.', 'error');
      } else {
        T.showUnavailable(section, 'Risk triage needs the VERITRAIL service, which is not reachable from this page. Nothing you entered was sent or stored. Request a demo to tier your use cases with our team.');
      }
    });
  });
  section.hidden = false;
}());
