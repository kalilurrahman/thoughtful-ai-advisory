/* AEGIS guardrail generator: form -> POST /api/shield/advise -> risk profile, tool matrix, draft policy YAML. */
(function () {
  'use strict';
  var doc = document;
  var section = doc.getElementById('guardrail-generator');
  if (!section || !window.AEGIS || !window.AegisTools) { return; }
  var A = window.AEGIS, T = window.AegisTools, el = T.el;
  var cfg = A.readConfig(doc);
  var form = doc.getElementById('gg-form');
  var status = doc.getElementById('gg-status');
  var result = doc.getElementById('gg-result');
  var out = section.querySelector('.gg-output');
  var policyEl = doc.getElementById('gg-policy');
  var copyStatus = doc.getElementById('gg-copy-status');
  var current = null;

  function buildProfile(v) {
    var p = {};
    ['app_name', 'purpose', 'affected_parties', 'model', 'vendor', 'data_sensitivity', 'autonomy',
      'human_approval_model', 'environment', 'risk_tier'].forEach(function (k) { if (v[k]) { p[k] = v[k]; } });
    ['users', 'data_categories', 'regulatory_obligations', 'existing_controls'].forEach(function (k) {
      if (v[k]) { p[k] = T.splitList(v[k]); }
    });
    if (v.tools) { p.tools = T.parseTools(v.tools); }
    return p;
  }

  function levelRow(name, dim) {
    if (!dim) { return null; }
    return [name, dim.level || '', dim.rationale || (dim.factors || []).join('; ')];
  }

  function render(data) {
    while (out.firstChild) { out.removeChild(out.firstChild); }
    var rp = data.risk_profile || {};
    var overall = rp.overall || {};
    out.appendChild(el(doc, 'p', { className: 'notice notice--warning' }, [el(doc, 'strong', { text: 'Draft for review. ' }),
      data.activation || 'This policy is not active. Activation requires review and recorded human approval.']));
    if (data.summary) { out.appendChild(el(doc, 'p', { text: data.summary })); }

    out.appendChild(el(doc, 'h3', { text: 'Runtime risk profile' }));
    out.appendChild(el(doc, 'p', {}, ['Overall runtime risk: ', el(doc, 'strong', { className: 'tier', text: overall.rating || '—' }), ' ',
      T.badge(doc, rp.evidence_status || 'Inferred')]));
    if (overall.rationale) { out.appendChild(el(doc, 'p', { className: 'small', text: overall.rationale })); }
    var rows = [levelRow('Autonomy', rp.autonomy), levelRow('Tool risk', rp.tool_risk), levelRow('Data exposure', rp.data_exposure),
      levelRow('Blast radius', rp.blast_radius)].filter(Boolean);
    if (rows.length) { out.appendChild(T.table(doc, 'Risk dimensions', ['Dimension', 'Level', 'Rationale'], rows)); }
    if (rp.tier_mismatch) {
      out.appendChild(el(doc, 'p', { className: 'notice notice--warning', text: 'The inferred risk tier (' + rp.inferred_risk_tier +
        ') differs from the tier you entered. Changing a risk tier requires human approval.' }));
    }

    var matrix = data.tool_matrix || [];
    out.appendChild(el(doc, 'h3', { text: 'Tool permission matrix' }));
    if (!matrix.length) {
      out.appendChild(el(doc, 'p', { text: 'No tools were declared. Anything undeclared is denied by default.' }));
    } else {
      out.appendChild(T.table(doc, 'Tool permission matrix', ['Tool', 'Operation', 'Decision', 'Reasons and conditions', 'Controls'],
        matrix.map(function (t) {
          var reasons = (t.reasons || []).concat(t.conditions || []).join('; ');
          return [t.tool, el(doc, 'span', {}, [String(t.operation || ''), ' ', T.badge(doc, t.operation_evidence || 'Inferred')]),
            String(t.decision || '') + (t.engine_action ? ' (' + t.engine_action + ')' : ''), reasons,
            T.controlLinks(doc, t.citations, '')];
        })));
      out.appendChild(el(doc, 'p', { className: 'small', text: 'Tools not listed here are denied by default.' }));
    }

    var rules = data.approval_rules || [];
    if (rules.length) {
      out.appendChild(el(doc, 'h3', { text: 'Human approval rules' }));
      var ul = el(doc, 'ul');
      rules.forEach(function (r) {
        ul.appendChild(el(doc, 'li', {}, [el(doc, 'strong', { text: r.trigger || r.id }), ' — approvers: ' + (r.approver_roles || []).join(', ')]));
      });
      out.appendChild(ul);
    }
    var dh = data.data_handling || {};
    if (dh.redaction_entities) {
      out.appendChild(el(doc, 'h3', { text: 'Data handling' }));
      out.appendChild(T.kv(doc, [['Data sensitivity', dh.data_sensitivity], ['Redacted entities', (dh.redaction_entities || []).join(', ')],
        ['Redaction surfaces', (dh.redaction_surfaces || []).join(', ')], ['Prompt logging', dh.prompt_logging],
        ['Response logging', dh.response_logging], ['Evidence retention (days)', dh.evidence_retention_days]]));
    }
    var lim = data.limits || {};
    if (lim.requests_per_minute !== undefined) {
      out.appendChild(el(doc, 'h3', { text: 'Starting limits' }));
      out.appendChild(T.kv(doc, [['Requests per minute', lim.requests_per_minute], ['Tool calls per session', lim.tool_calls_per_session],
        ['Tokens per day', lim.tokens_per_day], ['Cost per month (USD)', lim.cost_per_month_usd], ['On breach', lim.action_on_breach]]));
      if (lim.rationale) { out.appendChild(el(doc, 'p', { className: 'small', text: lim.rationale })); }
    }
    var missing = data.missing_inputs || [];
    if (missing.length) {
      out.appendChild(el(doc, 'h3', { text: 'Missing inputs' }));
      var mu = el(doc, 'ul');
      missing.forEach(function (m) { mu.appendChild(el(doc, 'li', {}, [T.badge(doc, m.status || 'Missing evidence'), ' ' + (m.label || m.field) + (m.impact ? ' — ' + m.impact : '')])); });
      out.appendChild(mu);
    }
    var assumptions = data.assumptions || [];
    if (assumptions.length) {
      out.appendChild(el(doc, 'h3', { text: 'Assumptions AEGIS made' }));
      var au = el(doc, 'ul');
      assumptions.forEach(function (a) { au.appendChild(el(doc, 'li', {}, [T.badge(doc, 'Inferred'), ' ' + a.field + ' = ' + a.assumed + (a.why ? ' — ' + a.why : '')])); });
      out.appendChild(au);
    }
    out.appendChild(T.controlLinks(doc, data.citations || [], 'AEGIS controls cited: '));
    if (data.policy_validation && data.policy_validation.valid === false) {
      out.appendChild(el(doc, 'p', { className: 'notice notice--error', text: 'Schema validation reported issues: ' + (data.policy_validation.errors || []).join('; ') }));
    }
    if (data.disclaimer) { out.appendChild(el(doc, 'p', { className: 'small', text: typeof data.disclaimer === 'string' ? data.disclaimer : '' })); }
    policyEl.textContent = data.policy_yaml || (data.policy ? JSON.stringify(data.policy, null, 2) : 'No policy returned.');
    current = data;
    result.hidden = false;
    result.focus();
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var v = T.readForm(form);
    var errs = [];
    if (!v.app_name) { errs.push({ id: 'gg-app_name', message: 'Enter the application or agent name.' }); }
    A.showErrors(form, errs, null);
    if (errs.length) { doc.getElementById('gg-app_name').focus(); return; }
    T.hideUnavailable(section);
    A.setStatus(status, 'Generating draft guardrails…', '');
    A.postJSON('/shield/advise', { profile: buildProfile(v) }, { config: cfg, timeout: 30000 }).then(function (r) {
      A.setStatus(status, '', '');
      if (r.kind === 'ok' && r.data) {
        A.track('tool_use', { tool: 'guardrail-generator', rating: (r.data.risk_profile && r.data.risk_profile.overall && r.data.risk_profile.overall.rating) || '' });
        render(r.data);
      } else if (r.kind === 'client_error') {
        A.setStatus(status, (r.data && r.data.error) || 'Please check your inputs.', 'error');
      } else {
        T.showUnavailable(section, r.kind === 'unavailable'
          ? 'The guardrail generator needs the AEGIS service, which is not reachable from this page. Nothing you entered was sent or stored. Request a demo and we will generate draft guardrails for your system with you.'
          : 'The AEGIS service returned an error, so no guardrails were generated. Please try again later or request a demo.');
      }
    });
  });

  doc.getElementById('gg-copy').addEventListener('click', function () {
    T.copyText(window, policyEl.textContent).then(function (ok) {
      A.setStatus(copyStatus, ok ? 'Policy YAML copied to the clipboard.' : 'Copy is not available in this browser; select the text and copy it manually.', ok ? 'success' : 'error');
    });
  });
  function fileBase() { return (current && current.policy && current.policy.policy_id) || 'aegis-draft-policy'; }
  doc.getElementById('gg-download').addEventListener('click', function () {
    T.downloadText(doc, policyEl.textContent, fileBase() + '.yaml', 'application/yaml');
  });
  doc.getElementById('gg-download-json').addEventListener('click', function () {
    var json = (current && (current.policy_json || (current.policy && JSON.stringify(current.policy, null, 2)))) || '{}';
    T.downloadText(doc, typeof json === 'string' ? json : JSON.stringify(json, null, 2), fileBase() + '.json', 'application/json');
  });
  section.hidden = false;
}());
