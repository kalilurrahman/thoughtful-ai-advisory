'use strict';
/* assessment-engine.js / assessment-report.js / tools-common.js unit behaviour (parity with Python is in
   tests/integration/test_website_engine_parity.py). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Document } = require('./fake-dom.js');

const JS = path.join(__dirname, '../../../app/website/static/js');
const E = require(path.join(JS, 'assessment-engine.js'));
const R = require(path.join(JS, 'assessment-report.js'));
const T = require(path.join(JS, 'tools-common.js'));

// Bundle exported by the Python test harness (written before node runs) or a minimal inline one.
const BUNDLE_FILE = process.env.AEGIS_ASSESSMENT_BUNDLE;
const bundle = BUNDLE_FILE && fs.existsSync(BUNDLE_FILE) ? JSON.parse(fs.readFileSync(BUNDLE_FILE, 'utf8')) : null;

test('roundHalfUp1dp implements floor((20*num + den) / (2*den)) / 10', () => {
  assert.equal(E.roundHalfUp1dp(1, 8), 0.1);     // 0.125 -> 0.1
  assert.equal(E.roundHalfUp1dp(3, 40), 0.1);    // 0.075 -> 0.1 (half up)
  assert.equal(E.roundHalfUp1dp(1, 40), 0);      // 0.025 -> 0.0
  assert.equal(E.roundHalfUp1dp(2, 3), 0.7);
  assert.equal(E.roundHalfUp1dp(900, 15), 60);
  assert.equal(E.roundHalfUp1dp(1, 3), 0.3);
  assert.throws(() => E.roundHalfUp1dp(1, 0));
});

test('validateAnswers mirrors Python validation rules', () => {
  const tpl = { questions: [{ id: 'A' }, { id: 'B' }] };
  assert.deepEqual(E.validateAnswers({ A: 1, B: '5' }, tpl), { A: 1, B: 5 });
  assert.deepEqual(E.validateAnswers({ A: 3.0, B: ' 2 ' }, tpl), { A: 3, B: 2 });
  assert.throws(() => E.validateAnswers({ A: 1 }, tpl), /missing answers: B/);
  assert.throws(() => E.validateAnswers({ A: 1, B: 1, C: 1 }, tpl), /unknown question ids: C/);
  assert.throws(() => E.validateAnswers({ A: true, B: 1 }, tpl), /A: score must be an integer 1-5/);
  assert.throws(() => E.validateAnswers({ A: 2.5, B: 1 }, tpl), /integer/);
  assert.throws(() => E.validateAnswers({ A: '01', B: 1 }, tpl), /integer/);
  assert.throws(() => E.validateAnswers({ A: 6, B: 1 }, tpl), /between 1 and 5/);
  assert.throws(() => E.validateAnswers([], tpl), /answers must be an object/);
});

test('normalizeProfile converts yes/true strings to booleans like Python', () => {
  const p = E.normalizeProfile({ uses_agents: 'Yes', eu_operations: 'no', industry: 'bfsi' });
  assert.deepEqual(p, { uses_agents: true, eu_operations: false, industry: 'bfsi' });
  assert.deepEqual(E.normalizeProfile(null), { uses_agents: false, eu_operations: false });
  assert.equal(E.normalizeProfile({ uses_agents: 1 }).uses_agents, true);
  assert.equal(E.normalizeProfile({ uses_agents: [] }).uses_agents, false);
});

test('report renderer uses text nodes only: markup in company names and results is not interpreted', { skip: !bundle }, () => {
  const answers = {};
  bundle.template.questions.forEach((q) => { answers[q.id] = 2; });
  const result = E.scoreAssessment(answers, { uses_agents: true, eu_operations: true }, bundle);
  result.level_interpretation = '<img src=x onerror=alert(1)>';
  const doc = new Document();
  const container = doc.createElement('div');
  R.renderReport(doc, container, result, { bundle, company: '<script>alert(1)</script>' });
  const html = container.innerHTML;
  assert.ok(!html.includes('<script>'), 'company name must be escaped');
  assert.ok(!html.includes('<img'), 'result strings must be escaped');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('Indicative — not a compliance determination'));
  assert.ok(html.includes('User-asserted'));
  assert.ok(!/baseline_priority|lead_rules|Platform candidate/.test(html), 'internal lead qualification is never shown');
  // every control link points at the generated control library
  container.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    assert.ok(href.startsWith('/framework/controls/') || href.startsWith('/contact/') || href.startsWith('/solutions/'), href);
  });
});

test('toMarkdown never includes internal lead tags and keeps the disclaimers', { skip: !bundle }, () => {
  const answers = {};
  bundle.template.questions.forEach((q) => { answers[q.id] = 1; });
  const result = E.scoreAssessment(answers, { ai_systems: '100+', uses_agents: true }, bundle);
  assert.ok(result.lead.tags.length > 0);
  const md = R.toMarkdown(result, { bundle, company: 'Example Bank', generated: '2026-10-21' });
  assert.ok(md.startsWith('# AI Governance Maturity Report — Example Bank'));
  for (const t of result.lead.tags) { assert.ok(!md.includes(t), t); }
  assert.ok(md.includes(result.disclaimer));
  assert.ok(md.includes(result.standard_disclaimer));
  assert.ok(md.includes('indicative — not a compliance determination'));
});

test('renderMarkdown (agent answers) never creates script elements or unsafe links', () => {
  const doc = new Document();
  const root = doc.createElement('div');
  root.appendChild(T.renderMarkdown(doc, [
    '# Heading <script>alert(1)</script>',
    '',
    'Text with [bad](javascript:alert(1)) and [ok](/framework/controls/is-11/) and [ext](https://example.com).',
    '',
    '- item *Inferred* and **bold** `code<b>`',
    '',
    '| A | B |', '|---|---|', '| <img src=x onerror=1> | *Critical gap* |',
    '',
    '```', '<script>x</script>', '```'
  ].join('\n')));
  const html = root.innerHTML;
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('href="/framework/controls/is-11/"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(html.includes('class="badge badge-inferred"'));
  assert.ok(html.includes('class="badge badge-critical"'));
  assert.ok(html.includes('<h3>'));
});

test('controlLinks only links real-looking control IDs and falls back to the no-source message', () => {
  const doc = new Document();
  const p = T.controlLinks(doc, ['IS-11', 'not-an-id', '<x>'], 'Cited: ');
  assert.equal(p.textContent, 'Cited: IS-11');
  const none = T.controlLinks(doc, [], 'Cited: ');
  assert.equal(none.textContent, 'Cited: No supporting evidence or framework source is available.');
});

test('parseTools and splitList build Shield advisor profile values', () => {
  assert.deepEqual(T.parseTools('crm_lookup:read\nissue_refund : payment\nsend_email'),
    [{ name: 'crm_lookup', operation: 'read' }, { name: 'issue_refund', operation: 'payment' }, { name: 'send_email' }]);
  assert.deepEqual(T.splitList('GDPR, EU AI Act;HIPAA\n'), ['GDPR', 'EU AI Act', 'HIPAA']);
  assert.equal(T.yesNo('yes'), true);
  assert.equal(T.yesNo('no'), false);
  assert.equal(T.yesNo(''), undefined);
});
