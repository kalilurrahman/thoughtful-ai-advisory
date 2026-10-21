/*
 * AEGIS Maturity Self-Assessment — browser scoring engine.
 *
 * Mirrors the Python reference engine app/assessment-engine/aegis_assessment/engine.py
 * (score_assessment / preliminary_result) field-for-field. Parity is enforced by
 * tests/integration/test_website_engine_parity.py. All score arithmetic uses integers and
 * the template's round-half-up rule: floor((20*num + den) / (2*den)) / 10.
 *
 * The scoring data (template + cited controls + standard disclaimer) is embedded in the page
 * at build time as <script type="application/json" id="aegis-assessment-data">.
 *
 * Usage (browser): AegisAssessment.scoreAssessment(answers, profile, bundle)
 * Usage (Node):    const E = require('./assessment-engine.js'); E.scoreAssessment(...)
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.AegisAssessment = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function AssessmentInputError(message) {
    var e = new Error(message);
    e.name = 'AssessmentInputError';
    return e;
  }

  // ---------------------------------------------------------------- arithmetic
  function floorDiv(a, b) {
    // integer floor division for integer a and positive integer b
    var r = a % b;
    var q = (a - r) / b;
    if (r !== 0 && (r < 0) !== (b < 0)) { q -= 1; }
    return q;
  }

  function roundHalfUp1dp(num, den) {
    if (!(den > 0)) { throw new Error('den must be positive'); }
    return floorDiv(20 * num + den, 2 * den) / 10;
  }

  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return (a / gcd(a, b)) * b; }

  // ---------------------------------------------------------------- python-like helpers
  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function hasKey(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function pyTruthy(v) {
    if (v === null || v === undefined || v === false || v === 0 || v === '') { return false; }
    if (typeof v === 'number' && isNaN(v)) { return true; } // bool(float('nan')) is True
    if (Array.isArray(v)) { return v.length > 0; }
    if (isPlainObject(v)) { return Object.keys(v).length > 0; }
    return true;
  }

  // Python == for JSON-like scalars (True == 1, 1 == 1.0); containers compared deeply.
  function pyEq(a, b) {
    if (a === undefined) { a = null; }
    if (b === undefined) { b = null; }
    var na = (typeof a === 'boolean') ? (a ? 1 : 0) : a;
    var nb = (typeof b === 'boolean') ? (b ? 1 : 0) : b;
    if (typeof na === 'number' && typeof nb === 'number') { return na === nb; }
    if (typeof a !== typeof b) { return false; }
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) { return false; }
      for (var i = 0; i < a.length; i++) { if (!pyEq(a[i], b[i])) { return false; } }
      return true;
    }
    if (isPlainObject(a)) {
      if (!isPlainObject(b)) { return false; }
      var ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) { return false; }
      for (var j = 0; j < ka.length; j++) { if (!hasKey(b, ka[j]) || !pyEq(a[ka[j]], b[ka[j]])) { return false; } }
      return true;
    }
    return a === b;
  }

  function sortedBy(arr, keyFn) {
    // stable sort by tuple key (arrays of numbers)
    return arr.map(function (x, i) { return { x: x, k: keyFn(x), i: i }; })
      .sort(function (p, q) {
        for (var n = 0; n < p.k.length; n++) {
          if (p.k[n] < q.k[n]) { return -1; }
          if (p.k[n] > q.k[n]) { return 1; }
        }
        return p.i - q.i;
      })
      .map(function (p) { return p.x; });
  }

  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  // ---------------------------------------------------------------- validation
  var CANONICAL_INT = /^(0|-?[1-9][0-9]*)$/;
  // Python str.isspace() characters (differs from JS \s: includes \x1c-\x1f and \x85, excludes \ufeff)
  var PY_WS = '\\t\\n\\x0b\\x0c\\r \\x1c-\\x1f\\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000';
  var PY_STRIP = new RegExp('^[' + PY_WS + ']+|[' + PY_WS + ']+$', 'g');

  function validateAnswers(answers, template) {
    if (!isPlainObject(answers)) {
      throw AssessmentInputError('answers must be an object of question_id -> score');
    }
    var qids = template.questions.map(function (q) { return q.id; });
    var missing = qids.filter(function (q) { return !hasKey(answers, q); });
    if (missing.length) { throw AssessmentInputError('missing answers: ' + missing.join(', ')); }
    var unknown = Object.keys(answers).filter(function (k) { return qids.indexOf(k) === -1; });
    if (unknown.length) { throw AssessmentInputError('unknown question ids: ' + unknown.sort().join(', ')); }
    var clean = {};
    qids.forEach(function (q) {
      var v = answers[q];
      var bad = q + ': score must be an integer 1-5';
      var iv;
      if (typeof v === 'number') {
        if (!isFinite(v) || Math.floor(v) !== v) { throw AssessmentInputError(bad); }
        iv = v;
      } else if (typeof v === 'string') {
        var s = v.replace(PY_STRIP, '');
        if (!CANONICAL_INT.test(s)) { throw AssessmentInputError(bad); }
        iv = parseInt(s, 10);
      } else {
        throw AssessmentInputError(bad);  // booleans, null, objects
      }
      if (iv < 1 || iv > 5) { throw AssessmentInputError(q + ': score must be between 1 and 5'); }
      clean[q] = iv;
    });
    return clean;
  }

  function normalizeProfile(profile) {
    var p = isPlainObject(profile) ? clone(profile) : {};
    ['uses_agents', 'eu_operations'].forEach(function (k) {
      var v = p[k];
      if (typeof v === 'string') {
        p[k] = ['true', 'yes', '1', 'y'].indexOf(v.replace(PY_STRIP, '').toLowerCase()) !== -1;
      } else {
        p[k] = pyTruthy(v);
      }
    });
    return p;
  }

  function profileMatches(cond, profile) {
    return Object.keys(cond).every(function (k) {
      return pyEq(hasKey(profile, k) ? profile[k] : null, cond[k]);
    });
  }

  // ---------------------------------------------------------------- scoring
  function byOrder(a, b) { return a.order - b.order; }

  function domainScores(clean, template) {
    var domains = template.domains.slice().sort(byOrder);
    var questions = template.questions.slice().sort(byOrder);
    var out = [], sums = {}, counts = {};
    domains.forEach(function (d) {
      var qs = questions.filter(function (q) { return q.domain === d.id; });
      var s = 0, answersMap = {};
      qs.forEach(function (q) { s += clean[q.id]; answersMap[q.id] = clean[q.id]; });
      sums[d.id] = s; counts[d.id] = qs.length;
      out.push({ id: d.id, name: d.name, weight: d.weight, score: roundHalfUp1dp(s * 100, 5 * qs.length), answers: answersMap });
    });
    return { domains: out, sums: sums, counts: counts };
  }

  function overallScore(sums, counts, template) {
    var L = 1, dens = {};
    template.domains.forEach(function (d) { dens[d.id] = 5 * counts[d.id]; L = lcm(L, dens[d.id]); });
    var num = 0;
    template.domains.forEach(function (d) { num += sums[d.id] * d.weight * (L / dens[d.id]); });
    return roundHalfUp1dp(num, L);
  }

  function levelFor(score, levels) {
    for (var i = 0; i < levels.length; i++) {
      if (levels[i].min <= score && score <= levels[i].max) { return levels[i]; }
    }
    return score > levels[levels.length - 1].min ? levels[levels.length - 1] : levels[0];
  }

  function bandFor(value, bands) {
    for (var i = 0; i < bands.length; i++) {
      if (bands[i].min <= value && value <= bands[i].max) { return bands[i].name; }
    }
    return value > bands[bands.length - 1].min ? bands[bands.length - 1].name : bands[0].name;
  }

  function unpack(bundle) {
    if (!bundle || !bundle.template) { throw new Error('assessment bundle with template is required'); }
    return bundle;
  }

  function preliminaryResult(answers, profile, bundle) {
    var template = unpack(bundle).template;
    var clean = validateAnswers(answers, template);
    var ds = domainScores(clean, template);
    var overall = overallScore(ds.sums, ds.counts, template);
    var lvl = levelFor(overall, template.scoring.levels);
    return {
      template_id: template.template.id,
      template_version: template.template.version,
      evidence_status: template.template.evidence_status,
      overall_score: overall,
      maturity_level: lvl.name,
      level_interpretation: lvl.interpretation,
      domains: ds.domains.map(function (d) { return { id: d.id, name: d.name, weight: d.weight, score: d.score }; })
    };
  }

  function scoreAssessment(answers, profile, bundle) {
    bundle = unpack(bundle);
    var template = bundle.template;
    var lib = bundle.controls || {};
    var clean = validateAnswers(answers, template);
    var prof = normalizeProfile(profile);
    var sc = template.scoring;
    var ds = domainScores(clean, template);
    var domainById = {};
    ds.domains.forEach(function (d) { domainById[d.id] = d; });
    var overall = overallScore(ds.sums, ds.counts, template);
    var lvl = levelFor(overall, sc.levels);
    var weight = {}, dname = {};
    template.domains.forEach(function (d) { weight[d.id] = d.weight; dname[d.id] = d.name; });
    var questions = template.questions.slice().sort(byOrder);

    function qview(q, withAction) {
      var v = { question_id: q.id, domain_id: q.domain, domain: dname[q.domain], text: q.text,
        score: clean[q.id], controls: q.controls.slice() };
      if (withAction) { v.action = q.action; }
      return v;
    }

    var strengths = sortedBy(questions.filter(function (q) { return clean[q.id] >= sc.strengths.min_score; }),
      function (q) { return [-clean[q.id], -weight[q.domain], q.order]; })
      .slice(0, sc.strengths.limit).map(function (q) { return qview(q, false); });

    var gaps = sortedBy(questions.filter(function (q) { return clean[q.id] <= sc.gaps.max_score; }),
      function (q) { return [clean[q.id], -weight[q.domain], q.order]; })
      .slice(0, sc.gaps.limit).map(function (q) { return qview(q, true); });

    var flags = [];
    template.critical_flags.forEach(function (f) {
      var w = f.when;
      if (clean[w.question] > w.max_score) { return; }
      if (hasKey(w, 'profile') && !profileMatches(w.profile, prof)) { return; }
      flags.push({ id: f.id, title: f.title, severity: f.severity, rationale: f.rationale,
        controls: f.controls.slice(), question_id: w.question, evidence_status: 'User-asserted' });
    });
    var flagIds = flags.map(function (f) { return f.id; });

    var plan = {}, planLabels = {};
    sc.action_plan.horizons.forEach(function (h) {
      var items = sortedBy(questions.filter(function (q) { return h.scores.indexOf(clean[q.id]) !== -1; }),
        function (q) { return [clean[q.id], -weight[q.domain], q.order]; });
      plan[h.horizon] = items.slice(0, sc.action_plan.limit_per_horizon).map(function (q) {
        return { question_id: q.id, domain: dname[q.domain], action: q.action, controls: q.controls.slice(), score: clean[q.id] };
      });
      planLabels[h.horizon] = h.label;
    });

    var ctrlIds = [];
    flags.forEach(function (f) { f.controls.forEach(function (c) { if (ctrlIds.indexOf(c) === -1) { ctrlIds.push(c); } }); });
    gaps.forEach(function (g) { g.controls.forEach(function (c) { if (ctrlIds.indexOf(c) === -1) { ctrlIds.push(c); } }); });
    var recControls = ctrlIds.slice(0, sc.recommended_controls.limit).map(function (c) {
      var ctl = lib[c];
      if (!ctl) { throw new Error('control ' + c + ' missing from assessment bundle'); }
      return { id: c, title: ctl.title, pillar: ctl.pillar, priority: ctl.priority, mappings: clone(ctl.mappings) };
    });

    var readiness = template.readiness_groups.map(function (fw) {
      return {
        framework: fw.framework,
        groups: fw.groups.map(function (g) {
          var s = 0;
          g.questions.forEach(function (q) { s += clean[q]; });
          var val = roundHalfUp1dp(s * 100, 5 * g.questions.length);
          return { id: g.id, name: g.name, value: val, band: bandFor(val, sc.readiness.bands), questions: g.questions.slice() };
        })
      };
    });

    function condTrue(cond) {
      if (pyTruthy(cond.always)) { return true; }
      if (hasKey(cond, 'overall_below')) { return overall < cond.overall_below; }
      if (hasKey(cond, 'domain_below')) {
        return Object.keys(cond.domain_below).some(function (d) { return domainById[d].score < cond.domain_below[d]; });
      }
      if (hasKey(cond, 'profile')) { return profileMatches(cond.profile, prof); }
      if (hasKey(cond, 'flag')) { return flagIds.indexOf(cond.flag) !== -1; }
      return false;
    }

    var modules = template.module_rules.filter(function (r) { return r.any.some(condTrue); })
      .map(function (r) { return { module: r.module, reason: r.reason }; });
    var leadRules = template.lead_rules.filter(function (r) { return r.any.some(condTrue); });

    return {
      template_id: template.template.id,
      template_version: template.template.version,
      evidence_status: template.template.evidence_status,
      overall_score: overall,
      maturity_level: lvl.name,
      level_interpretation: lvl.interpretation,
      domains: ds.domains,
      strengths: strengths,
      gaps: gaps,
      critical_flags: flags,
      action_plan: plan,
      action_plan_labels: planLabels,
      recommended_controls: recControls,
      readiness: readiness,
      recommended_modules: modules,
      lead: { tags: leadRules.map(function (r) { return r.tag; }), labels: leadRules.map(function (r) { return r.label; }) },
      profile: prof,
      disclaimer: template.template.disclaimer,
      standard_disclaimer: bundle.standard_disclaimer,
      cta: clone(template.cta)
    };
  }

  /** Read the bundle embedded by the site generator (browser only). */
  function loadBundle(doc) {
    var el = (doc || document).getElementById('aegis-assessment-data');
    return el ? JSON.parse(el.textContent) : null;
  }

  return {
    AssessmentInputError: AssessmentInputError,
    roundHalfUp1dp: roundHalfUp1dp,
    validateAnswers: validateAnswers,
    normalizeProfile: normalizeProfile,
    preliminaryResult: preliminaryResult,
    scoreAssessment: scoreAssessment,
    loadBundle: loadBundle
  };
}));
