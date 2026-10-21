'use strict';
/* node --test tests/unit/js/ — site.js helpers (email gate, URL safety, API outcome classification, lead forms). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const SITE = require(path.join(__dirname, '../../../app/website/static/js/site.js'));
const FREE = ['gmail.com', 'outlook.com', 'yahoo.co.uk', 'proton.me'];

test('isValidEmail accepts typical business addresses and rejects junk', () => {
  assert.equal(SITE.isValidEmail('jane.doe@example-bank.com'), true);
  assert.equal(SITE.isValidEmail("o'neil+ai@corp.co.uk"), true);
  for (const bad of ['', 'jane', 'jane@', '@corp.com', 'jane@corp', 'a b@corp.com', 'jane@corp.c']) {
    assert.equal(SITE.isValidEmail(bad), false, bad);
  }
});

test('isBusinessEmail rejects free-mail domains (case-insensitive, subdomains) and invalid addresses', () => {
  assert.equal(SITE.isBusinessEmail('jane@gmail.com', FREE), false);
  assert.equal(SITE.isBusinessEmail('Jane@GMAIL.COM', FREE), false);
  assert.equal(SITE.isBusinessEmail('jane@mail.yahoo.co.uk', FREE), false);
  assert.equal(SITE.isBusinessEmail('jane@proton.me', FREE), false);
  assert.equal(SITE.isBusinessEmail('jane@examplebank.com', FREE), true);
  assert.equal(SITE.isBusinessEmail('jane@notgmail.com', FREE), true, 'suffix match must be on a label boundary');
  assert.equal(SITE.isBusinessEmail('not-an-email', FREE), false);
});

test('safeUrl only allows same-site paths or http(s) URLs, optionally under a prefix', () => {
  assert.equal(SITE.safeUrl('/api/reports/lead_abc.pdf?t=1', '/api/reports/'), '/api/reports/lead_abc.pdf?t=1');
  assert.equal(SITE.safeUrl('https://www.aegis-governance.example/api/reports/x.md?t=2', '/api/reports/'),
    'https://www.aegis-governance.example/api/reports/x.md?t=2');
  assert.equal(SITE.safeUrl('javascript:alert(1)'), null);
  assert.equal(SITE.safeUrl(' JavaScript:alert(1)'), null);
  assert.equal(SITE.safeUrl('data:text/html,<script>'), null);
  assert.equal(SITE.safeUrl('//evil.example/x'), null);
  assert.equal(SITE.safeUrl('/downloads/x.pdf', '/api/reports/'), null);
  assert.equal(SITE.safeUrl(42), null);
});

test('classify distinguishes success, validation errors and an absent API', () => {
  assert.equal(SITE.classify(201, 'application/json'), 'ok');
  assert.equal(SITE.classify(204, ''), 'ok');
  assert.equal(SITE.classify(200, 'text/html'), 'unavailable', 'HTML 200 = static host fallback page, not the API');
  assert.equal(SITE.classify(422, 'application/json'), 'client_error');
  assert.equal(SITE.classify(429, 'application/json'), 'client_error');
  assert.equal(SITE.classify(500, 'application/json'), 'server_error');
  for (const s of [0, 404, 405, 501, 502, 503, 504]) { assert.equal(SITE.classify(s, 'application/json'), 'unavailable', String(s)); }
  assert.equal(SITE.classify(400, 'text/html'), 'unavailable');
});

test('postJSON treats a network failure as unavailable and parses JSON errors', async () => {
  const cfg = { api_base: '/api' };
  const down = await SITE.postJSON('/leads', {}, { config: cfg, fetch: () => Promise.reject(new TypeError('fail')) });
  assert.deepEqual([down.kind, down.status], ['unavailable', 0]);
  let seen;
  const fake = (url, init) => {
    seen = { url, init };
    return Promise.resolve({ status: 422, headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ error: 'Please use your business email address.', field: 'email', code: 'business_email_required' }) });
  };
  const r = await SITE.postJSON('/leads', { email: 'a@gmail.com' }, { config: cfg, fetch: fake });
  assert.equal(seen.url, '/api/leads');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers['Content-Type'], 'application/json');
  assert.equal(seen.init.credentials, 'same-origin');
  assert.equal(r.kind, 'client_error');
  assert.equal(r.data.code, 'business_email_required');
});

function fakeForm(fields, attrs) {
  const els = {};
  const list = fields.map((f) => {
    const e = Object.assign({ type: 'text', required: false, value: '', checked: false }, f);
    els[e.name] = e;
    return e;
  });
  return {
    elements: els,
    getAttribute: (k) => (attrs[k] === undefined ? null : attrs[k]),
    querySelectorAll: () => list,
    querySelector: (sel) => {
      const m = /label\[for="(.+)"\]/.exec(sel);
      const f = m && list.find((x) => x.id === m[1]);
      return f ? { textContent: f.label || f.name } : null;
    }
  };
}

test('validateLeadForm requires consent, required fields and a business email for gated forms', () => {
  const form = fakeForm([
    { name: 'name', id: 'lf-name', required: true, label: 'Full name (required)' },
    { name: 'email', id: 'lf-email', type: 'email', required: true, value: 'jane@gmail.com', label: 'Work email' },
    { name: 'consent', id: 'lf-consent', type: 'checkbox', required: true },
    { name: 'website', id: 'lf-website' }
  ], { 'data-business-email': 'true', 'data-aegis-form': 'baseline' });
  const errs = SITE.validateLeadForm(form, { free_mail_domains: FREE });
  assert.deepEqual(errs.map((e) => e.id), ['lf-name', 'lf-email', 'lf-consent']);
  assert.match(errs[1].message, /business email/);
});

test('contactPayload matches the /api/contact contract (boolean consent, honeypot field "website")', () => {
  const form = fakeForm([
    { name: 'name', id: 'n', value: ' Jane ' }, { name: 'email', id: 'e', value: 'jane@corp.com' },
    { name: 'company', id: 'c', value: 'Corp' }, { name: 'message', id: 'm', value: '' },
    { name: 'consent', id: 'k', type: 'checkbox', checked: true }, { name: 'website', id: 'w', value: '' }
  ], { 'data-aegis-form': 'waitlist', 'data-tool': 'agentic-risk-checker' });
  const p = SITE.contactPayload(form);
  assert.equal(p.form, 'waitlist');
  assert.equal(p.consent, true);
  assert.equal(p.website, '');
  assert.equal(p.name, 'Jane');
  assert.equal(p.tool, 'agentic-risk-checker');
  assert.equal('message' in p, false, 'empty optional fields are omitted');
});
