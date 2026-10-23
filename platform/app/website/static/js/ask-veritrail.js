/* Ask VERITRAIL chat: POST /api/agent/message; renders the agent's Markdown safely with citations and evidence labels. */
(function () {
  'use strict';
  var doc = document;
  var section = doc.getElementById('ask-veritrail');
  if (!section || !window.VERITRAIL || !window.VeritrailTools) { return; }
  var A = window.VERITRAIL, T = window.VeritrailTools, el = T.el;
  var cfg = A.readConfig(doc);
  var form = doc.getElementById('ask-form');
  var input = doc.getElementById('ask-input');
  var log = doc.getElementById('ask-log');
  var status = doc.getElementById('ask-status');
  var KEY = 'veritrail.ask.session';
  var sessionId = null;
  try { sessionId = window.sessionStorage.getItem(KEY); } catch (e) { /* ignore */ }

  function addMessage(author, nodes, cls) {
    var m = el(doc, 'div', { className: 'chat-msg ' + (cls || '') }, [el(doc, 'p', { className: 'chat-msg-author', text: author })]);
    nodes.forEach(function (n) { if (n) { m.appendChild(n); } });
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  function renderAgent(d) {
    var nodes = [T.renderMarkdown(doc, d.message || d.markdown || d.answer || '', 4)];
    if ((d.citations || []).length) { nodes.push(T.controlLinks(doc, d.citations, 'VERITRAIL controls cited: ')); }
    else { nodes.push(el(doc, 'p', { className: 'cite', text: 'No supporting evidence or framework source is available.' })); }
    (d.pending_approvals || []).forEach(function (a) {
      nodes.push(el(doc, 'p', { className: 'notice notice--warning', text: 'Pending human approval (' + (a.type || 'action') + '): ' + (a.message || a.approval_id || '') + '. Nothing has been executed.' }));
    });
    if (d.clarifying_question && (d.message || '').indexOf(d.clarifying_question) === -1) {
      nodes.push(el(doc, 'p', {}, [el(doc, 'strong', { text: 'Question: ' }), d.clarifying_question]));
    }
    if (d.cta && d.cta.url && T.linkHref(d.cta.url) && String(d.message || '').indexOf(d.cta.url) === -1) {
      nodes.push(el(doc, 'p', {}, [el(doc, 'a', { href: T.linkHref(d.cta.url), 'data-cta': 'agent_cta', text: d.cta.label || 'Learn more' })]));
    }
    addMessage('VERITRAIL', nodes, 'chat-msg--agent');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var text = String(input.value || '').trim();
    A.showErrors(form, text ? [] : [{ id: 'ask-input', message: 'Type a question first.' }], null);
    if (!text) { input.focus(); return; }
    T.hideUnavailable(section);
    addMessage('You', [el(doc, 'p', { text: text })], 'chat-msg--user');
    input.value = '';
    A.setStatus(status, 'VERITRAIL is working on your answer…', '');
    var body = { message: text };
    if (sessionId) { body.session_id = sessionId; }
    A.postJSON('/agent/message', body, { config: cfg, timeout: 30000 }).then(function (r) {
      A.setStatus(status, '', '');
      if (r.kind === 'ok' && r.data) {
        if (r.data.session_id && /^[A-Za-z0-9_-]{1,64}$/.test(r.data.session_id)) {
          sessionId = r.data.session_id;
          try { window.sessionStorage.setItem(KEY, sessionId); } catch (e) { /* ignore */ }
        }
        A.track('tool_use', { tool: 'ask-veritrail', intent: r.data.intent || '' });
        renderAgent(r.data);
      } else if (r.kind === 'client_error') {
        A.setStatus(status, (r.data && r.data.error) || 'Your message could not be processed.', 'error');
      } else {
        T.showUnavailable(section, 'Ask VERITRAIL needs the VERITRAIL service, which is not reachable from this page, so your question was not sent. Request a demo to see the VERITRAIL Agent with your own scenarios.');
      }
    });
  });

  input.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault();
      if (form.requestSubmit) { form.requestSubmit(); } else { form.dispatchEvent(new Event('submit', { cancelable: true })); }
    }
  });
  section.hidden = false;
}());
