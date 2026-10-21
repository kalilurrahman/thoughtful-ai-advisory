/*
 * AEGIS Maturity Self-Assessment — browser UI.
 * Depends on site.js (AEGIS), assessment-engine.js (AegisAssessment), assessment-report.js (AegisReport).
 *
 * Flow: profile -> 8 domain steps -> instant preliminary result -> business-email gate ->
 * POST /api/leads -> detailed report with server PDF/MD links. If the API is unreachable
 * (static hosting) the detailed report is rendered in the browser, with Markdown download and
 * print-to-PDF, and the user is told nothing was stored or emailed.
 * Progress (profile, answers, step — never contact details) is kept in sessionStorage only.
 */
(function () {
  'use strict';
  var doc = document;
  var root = doc.getElementById('assessment');
  if (!root || !window.AegisAssessment || !window.AegisReport || !window.AEGIS) { return; }
  var A = window.AEGIS, E = window.AegisAssessment, R = window.AegisReport;
  var STORE_KEY = 'aegis.assessment.v1';
  var bundle = E.loadBundle(doc);
  var cfg = A.readConfig(doc);
  var form = doc.getElementById('assessment-form');
  var steps = Array.prototype.slice.call(form.querySelectorAll('.assessment-step'));
  var total = steps.length;
  var progress = doc.getElementById('assessment-progress');
  var progressLabel = doc.getElementById('assessment-progress-label');
  var progressWrap = doc.getElementById('assessment-progress-wrap');
  var back = doc.getElementById('assessment-back');
  var next = doc.getElementById('assessment-next');
  var prelim = doc.getElementById('assessment-preliminary');
  var gate = doc.getElementById('assessment-gate');
  var gateStatus = doc.getElementById('gate-status');
  var report = doc.getElementById('assessment-report');
  var reportBody = doc.getElementById('report-body');
  var reportActions = doc.getElementById('report-actions');
  var delivery = doc.getElementById('report-delivery');
  var state = { step: 0, profile: {}, answers: {}, started: false };

  function storage() { try { return window.sessionStorage; } catch (e) { return null; } }
  function save() {
    var s = storage();
    if (s) { try { s.setItem(STORE_KEY, JSON.stringify({ step: state.step, profile: state.profile, answers: state.answers, started: state.started })); } catch (e) { /* quota/private mode */ } }
  }
  function load() {
    var s = storage();
    if (!s) { return; }
    try {
      var v = JSON.parse(s.getItem(STORE_KEY) || 'null');
      if (v && typeof v === 'object') {
        state.step = Math.min(Math.max(parseInt(v.step, 10) || 0, 0), total - 1);
        state.profile = v.profile || {};
        state.answers = v.answers || {};
        state.started = !!v.started;
      }
    } catch (e) { /* ignore corrupt state */ }
  }
  function clearStore() { var s = storage(); if (s) { try { s.removeItem(STORE_KEY); } catch (e) { /* ignore */ } } }

  function applyState() {
    Object.keys(state.profile).forEach(function (k) {
      var v = state.profile[k];
      var sel = doc.getElementById('pf-' + k);
      if (sel && sel.tagName === 'SELECT') { sel.value = v; }
      else {
        var r = doc.getElementById('pf-' + k + (v === true ? '-yes' : '-no'));
        if (r && typeof v === 'boolean') { r.checked = true; }
      }
    });
    Object.keys(state.answers).forEach(function (q) {
      var r = doc.getElementById('q-' + q.toLowerCase() + '-' + state.answers[q]);
      if (r) { r.checked = true; }
    });
  }

  function readInputs() {
    Array.prototype.forEach.call(form.querySelectorAll('[data-profile]'), function (el) {
      var k = el.getAttribute('data-profile');
      if (el.tagName === 'SELECT') { if (el.value) { state.profile[k] = el.value; } else { delete state.profile[k]; } }
      else if (el.checked) { state.profile[k] = (el.value === 'true'); }
    });
    Array.prototype.forEach.call(form.querySelectorAll('input[data-question]:checked'), function (el) {
      state.answers[el.getAttribute('data-question')] = parseInt(el.value, 10);
    });
  }

  function showStep(n, focus) {
    state.step = n;
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    back.hidden = n === 0;
    next.textContent = n === total - 1 ? 'See my results' : 'Next';
    progress.value = n + 1;
    progressLabel.textContent = 'Step ' + (n + 1) + ' of ' + total + ' — ' + steps[n].getAttribute('data-step-title');
    A.showErrors(form, [], 'assessment-errors');
    save();
    if (focus) { var t = steps[n].querySelector('.step-title'); if (t) { t.focus(); } }
  }

  function stepErrors(n) {
    var errs = [];
    var s = steps[n];
    Array.prototype.forEach.call(s.querySelectorAll('select[required]'), function (el) {
      if (!el.value) {
        var l = s.querySelector('label[for="' + el.id + '"]');
        errs.push({ id: el.id, message: 'Select: ' + (l ? l.textContent.replace('(required)', '').trim() : el.name) });
      }
    });
    Array.prototype.forEach.call(s.querySelectorAll('fieldset[data-profile-group], fieldset[data-question]'), function (fs) {
      if (!fs.querySelector('input:checked')) {
        var lg = fs.querySelector('legend');
        var text = lg ? lg.textContent.replace('(required)', '').replace(/\s+/g, ' ').trim() : fs.id;
        errs.push({ id: fs.id, message: 'Choose an answer: ' + text });
      }
    });
    return errs;
  }

  function renderPreliminary() {
    var p = E.preliminaryResult(state.answers, state.profile, bundle);
    doc.getElementById('prelim-score').textContent = p.overall_score.toFixed(1);
    doc.getElementById('prelim-level').textContent = p.maturity_level;
    doc.getElementById('prelim-interpretation').textContent = p.level_interpretation;
    var list = doc.getElementById('prelim-domains');
    var bars = R.domainBars(doc, p.domains, 'prelim-d');
    while (list.firstChild) { list.removeChild(list.firstChild); }
    while (bars.firstChild) { list.appendChild(bars.firstChild); }
    form.hidden = true;
    progressWrap.hidden = true;
    prelim.hidden = false;
    doc.getElementById('prelim-title').focus();
    A.track('assessment_preliminary', { level: p.maturity_level });
    A.track('assessment_gate_view', {});
    return p;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    readInputs();
    var errs = stepErrors(state.step);
    if (errs.length) { A.showErrors(form, errs, 'assessment-errors'); return; }
    if (state.step === 0 && !state.started) { state.started = true; A.track('assessment_start', {}); }
    if (state.step < total - 1) {
      A.track('assessment_step', { step: state.step + 1 });
      showStep(state.step + 1, true);
    } else {
      save();
      renderPreliminary();
    }
  });
  back.addEventListener('click', function () { readInputs(); if (state.step > 0) { showStep(state.step - 1, true); } });
  form.addEventListener('change', function () { readInputs(); save(); });

  // ---------------------------------------------------------------- gate + report
  function gateErrors() {
    var errs = [];
    var v = function (id) { return String(doc.getElementById(id).value || '').trim(); };
    if (!v('gate-name')) { errs.push({ id: 'gate-name', message: 'Enter your full name.' }); }
    var email = v('gate-email');
    if (!email) { errs.push({ id: 'gate-email', message: 'Enter your work email.' }); }
    else if (!A.isValidEmail(email)) { errs.push({ id: 'gate-email', message: 'Enter a valid email address, like name@company.com.' }); }
    else if (!A.isBusinessEmail(email, cfg.free_mail_domains)) { errs.push({ id: 'gate-email', message: 'Please use your business email address (personal email domains are not accepted).' }); }
    if (!v('gate-company')) { errs.push({ id: 'gate-company', message: 'Enter your organization.' }); }
    if (!doc.getElementById('gate-consent').checked) { errs.push({ id: 'gate-consent', message: 'Please confirm your consent so we can prepare your report.' }); }
    return errs;
  }

  function button(label, onClick, cls) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + (cls || 'btn-secondary');
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function link(label, href, fmt) {
    var a = doc.createElement('a');
    a.className = 'btn btn-primary';
    a.href = href;
    a.textContent = label;
    a.addEventListener('click', function () { A.track('assessment_report_download', { format: fmt, mode: 'server' }); });
    return a;
  }

  function downloadMarkdown(md, company) {
    var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = doc.createElement('a');
    a.href = url;
    a.download = 'AEGIS_Maturity_Report' + (company ? '_' + company.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40) : '') + '.md';
    doc.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  function showReport(result, mode, info) {
    var company = info.company;
    if (result && result.lead) { delete result.lead; } // internal qualification: never shown
    R.renderReport(doc, reportBody, result, { bundle: bundle, company: company });
    while (reportActions.firstChild) { reportActions.removeChild(reportActions.firstChild); }
    delivery.className = 'report-delivery notice ' + (mode === 'server' ? 'notice--success' : 'notice--warning');
    delivery.textContent = info.message;
    if (mode === 'server') {
      var pdf = A.safeUrl(info.pdf, '/api/reports/');
      var md = A.safeUrl(info.md, '/api/reports/');
      if (pdf) { reportActions.appendChild(link('Download PDF report', pdf, 'pdf')); }
      if (md) { reportActions.appendChild(link('Download Markdown', md, 'md')); }
    } else {
      reportActions.appendChild(button('Download Markdown', function () {
        downloadMarkdown(R.toMarkdown(result, { bundle: bundle, company: company }), company);
        A.track('assessment_report_download', { format: 'md', mode: 'local' });
      }, 'btn-primary'));
    }
    reportActions.appendChild(button('Print or save as PDF', function () {
      A.track('assessment_report_download', { format: 'print', mode: mode });
      window.print();
    }));
    prelim.hidden = true;
    report.hidden = false;
    doc.body.classList.add('report-ready');
    delivery.focus();
  }

  function localFallback(info, reason) {
    var result = E.scoreAssessment(state.answers, state.profile, bundle);
    var msg = (reason === 'unavailable'
      ? 'We could not reach the AEGIS service, so your details were not saved and this report has not been emailed to you. '
      : 'The AEGIS service returned an error, so your details may not have been saved and this report has not been emailed to you. ')
      + 'Your detailed report has been generated in your browser below. Download it as Markdown or use “Print or save as PDF”.';
    showReport(result, 'local', { company: info.company, message: msg });
  }

  gate.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var errs = gateErrors();
    A.showErrors(gate, errs, 'gate-errors');
    if (errs.length) { return; }
    var val = function (id) { return String(doc.getElementById(id).value || '').trim(); };
    var info = { company: val('gate-company') };
    if (val('gate-website')) { localFallback(info, 'unavailable'); return; } // honeypot: send nothing
    var payload = {
      email: val('gate-email'), name: val('gate-name'), company: info.company, role: val('gate-role'),
      consent: true, marketing_opt_in: doc.getElementById('gate-marketing').checked,
      answers: state.answers, profile: state.profile, source: 'website:maturity-assessment', website: ''
    };
    var btn = gate.querySelector('button[type="submit"]');
    btn.disabled = true;
    A.setStatus(gateStatus, 'Preparing your report…', '');
    A.postJSON('/leads', payload, { config: cfg, timeout: 30000 }).then(function (r) {
      btn.disabled = false;
      if (r.kind === 'ok' && r.data && r.data.result) {
        A.setStatus(gateStatus, '', '');
        A.track('assessment_lead_submitted', { level: r.data.result.maturity_level });
        var es = r.data.email_status;
        var msg = 'Your detailed report is ready. ' + (es === 'sent'
          ? 'A copy has also been emailed to you.'
          : es === 'pending_approval'
            ? 'Emailing a copy is queued for review by our team (AEGIS requires human approval for external communications), so please use the download links below.'
            : 'We were not able to email a copy, so please use the download links below.');
        showReport(r.data.result, 'server', { company: info.company, message: msg, pdf: r.data.report_pdf_url, md: r.data.report_md_url });
      } else if (r.kind === 'client_error') {
        var field = r.data && r.data.field;
        var message = (r.data && r.data.error) || 'Please check your details and try again.';
        var map = { email: 'gate-email', name: 'gate-name', company: 'gate-company', consent: 'gate-consent' };
        if (map[field]) { A.showErrors(gate, [{ id: map[field], message: message }], 'gate-errors'); A.setStatus(gateStatus, '', ''); }
        else { A.setStatus(gateStatus, message, 'error'); gateStatus.focus(); }
      } else {
        A.setStatus(gateStatus, '', '');
        localFallback(info, r.kind);
      }
    });
  });

  doc.getElementById('assessment-restart').addEventListener('click', function () {
    clearStore();
    state = { step: 0, profile: {}, answers: {}, started: false };
    form.reset();
    gate.reset();
    report.hidden = true;
    prelim.hidden = true;
    form.hidden = false;
    progressWrap.hidden = false;
    doc.body.classList.remove('report-ready');
    showStep(0, true);
  });

  load();
  applyState();
  root.hidden = false;
  showStep(state.step, false);
}());
