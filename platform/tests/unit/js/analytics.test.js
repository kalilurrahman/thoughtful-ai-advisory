'use strict';
/* analytics.js: cookieless, DNT/GPC-respecting, no personal data, sendBeacon with text/plain body. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const AN = require(path.join(__dirname, '../../../app/website/static/js/analytics.js'));

function env(navExtra) {
  const sent = [];
  const nav = Object.assign({ sendBeacon: (url, body) => { sent.push({ url, body }); return true; } }, navExtra || {});
  return { sent, env: { navigator: nav, location: { pathname: '/tools/maturity-assessment/', search: '?t=secret', hash: '#x' } } };
}

test('sends {name, path, props} via sendBeacon to /api/events with pathname only', () => {
  const { sent, env: e } = env();
  const track = AN.makeTracker(e, '/api/events');
  assert.equal(track('cta_click', { cta: 'header_baseline' }), true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, '/api/events');
  assert.equal(typeof sent[0].body, 'string', 'string body => text/plain (no CORS preflight, accepted by the API)');
  const ev = JSON.parse(sent[0].body);
  assert.deepEqual(Object.keys(ev).sort(), ['name', 'path', 'props']);
  assert.equal(ev.path, '/tools/maturity-assessment/');
  assert.deepEqual(ev.props, { cta: 'header_baseline' });
});

test('respects Do Not Track and Global Privacy Control', () => {
  for (const extra of [{ doNotTrack: '1' }, { doNotTrack: 'yes' }, { globalPrivacyControl: true }]) {
    const { sent, env: e } = env(extra);
    assert.equal(AN.makeTracker(e)('page_view', {}), false);
    assert.equal(sent.length, 0);
  }
  const w = env();
  w.env.doNotTrack = '1';
  assert.equal(AN.makeTracker(w.env)('page_view', {}), false);
});

test('only API-accepted event names are sent', () => {
  const { sent, env: e } = env();
  const track = AN.makeTracker(e);
  assert.equal(track('made_up_event', {}), false);
  for (const n of AN.EVENTS) { track(n, {}); }
  assert.equal(sent.length, AN.EVENTS.length);
  assert.deepEqual(AN.EVENTS.slice().sort(), ['assessment_gate_view', 'assessment_lead_submitted', 'assessment_preliminary',
    'assessment_report_download', 'assessment_start', 'assessment_step', 'cta_click', 'form_submit', 'outbound_click',
    'page_view', 'tool_use'].sort());
});

test('props drop personal data (email-like values, identity keys) and non-scalars', () => {
  const p = AN.sanitizeProps({ cta: 'x', step: 3, ok: true, email: 'a@b.com', note: 'contact a@b.com', name: 'Jane',
    company: 'Corp', nested: { a: 1 }, long: 'y'.repeat(500) });
  assert.deepEqual(Object.keys(p).sort(), ['cta', 'long', 'ok', 'step']);
  assert.equal(p.long.length, 120);
});

test('never throws when sendBeacon is missing or throws', () => {
  const e = { navigator: { sendBeacon: () => { throw new Error('blocked'); } }, location: { pathname: '/' } };
  assert.equal(AN.makeTracker(e)('page_view', {}), false);
  assert.equal(AN.makeTracker({ navigator: {}, location: { pathname: '/' } })('page_view', {}), false);
});
