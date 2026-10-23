"""Knowledge retrieval over governed VERITRAIL content (stdlib BM25).

Indexes whatever sources exist at query time (other workstreams add files
concurrently); the index is rebuilt automatically when any source file changes.

Sources:
  content/controls/controls.yaml                         (one doc per control)
  content/assessment_templates/maturity_self_assessment.yaml (questions + critical flags)
  content/assessment_templates/use_case_assessment.yaml  (use-case questions + modules)
  content/policy_packs/*.yaml|*.yml|*.json               (policy packs; id + version cited)
  content/industry_packs/*.yaml|*.yml                    (industry packs)
  content/*.md                                           (chunked by heading)
  docs/COMPLIANCE_MAPPING.md                             (chunked by heading)
"""
from __future__ import annotations

import json
import math
import re
import threading
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from veritrail_common.content import controls_by_id, load_control_library
from veritrail_common.paths import ASSESSMENT_TEMPLATE_FILE, CONTENT_DIR, CONTROLS_FILE, REPO_ROOT

from .config import DOCS_DIR, USE_CASE_TEMPLATE_FILE

CONTROL_ID_RE = re.compile(r"\b(AO|EI|GL|IS|SE)-(\d{2})\b", re.IGNORECASE)
MATURITY_QID_RE = re.compile(r"\b(STR|INV|RSK|DAT|SEC|FST|HUM|ASR)-Q\d\b", re.IGNORECASE)
UC_QID_RE = re.compile(r"\bUC-[A-Z]{2,4}-Q\d{1,2}\b", re.IGNORECASE)
FLAG_ID_RE = re.compile(r"\bFLAG-[A-Z-]+\b")

FRAMEWORK_LABELS = {"nist_ai_rmf": "NIST AI RMF 1.0", "iso_42001": "ISO/IEC 42001:2023", "eu_ai_act": "EU AI Act (Regulation (EU) 2024/1689)"}

STOPWORDS = set("""
a an and are as at be been being but by can could do does did for from has have having how i if in into is it its
me my of on or our ours should so than that the their them then there these they this those to us was we were what
when where which who whom why will with would you your yours about any all also am just more most no not only own same
such too very s t don shall may might must tell give show explain list please need want know get let like make use using
veritrail handle ensure ensuring require requires required requirement requirements organization organisation company
companies doing done way ways best practice practices good something anything thing things one ones does do help
""".split())

SYNONYMS = {
    "pii": ["personal", "data", "redaction"],
    "gdpr": ["privacy", "personal", "data"],
    "dpia": ["privacy", "impact", "assessment"],
    "llm": ["genai", "generative", "prompt"],
    "chatbot": ["genai", "llm", "disclosure"],
    "gpt": ["genai", "llm", "vendor"],
    "agent": ["agentic", "tool"],
    "agents": ["agentic", "tool"],
    "guardrail": ["runtime", "policy", "enforcement"],
    "guardrails": ["runtime", "policy", "enforcement"],
    "jailbreak": ["injection", "adversarial"],
    "redteam": ["adversarial", "injection", "testing"],
    "audit": ["evidence", "logging"],
    "logs": ["logging", "log"],
    "inventory": ["register", "registry"],
    "vendor": ["third", "party", "procurement"],
    "supplier": ["vendor", "third", "party"],
    "bias": ["fairness"],
    "oversight": ["human", "review"],
    "hitl": ["human", "approval", "oversight"],
    "approval": ["approve", "human"],
    "killswitch": ["kill", "switch", "rollback"],
    "drift": ["monitoring", "performance"],
    "incident": ["incidents", "escalation"],
    "transparency": ["disclosure"],
    "training": ["literacy"],
    "tier": ["classification", "tiering", "risk"],
    "tiering": ["classification", "tier", "risk"],
}

# Vocabulary indicating a question is within AI-governance scope.
GOVERNANCE_VOCAB = set("""
ai artificial intelligence model models llm genai generative agent agents agentic governance risk risks control controls
policy policies privacy data security compliance compliant regulation regulatory act iso nist rmf 42001 eu framework
frameworks audit evidence oversight human approval inventory register vendor third party bias fairness transparency
disclosure incident incidents monitoring drift guardrail guardrails runtime prompt injection jailbreak redaction pii
gdpr dpia tier tiering classification assessment assess maturity readiness certification certified certify accountability
owner ownership lifecycle deployment testing red team kill switch rollback logging literacy chatbot copilot rag tool tools
safety harm explainability appeal procurement contract shadow use case cases high-risk prohibited article annex clause
governance veritrail pillar pillars module modules pack packs industry bfsi healthcare pharma banking insurance saas gcc
public sector gpai obligations obligation provider providers deployer deployers maturity soc nist regulator regulators
auditor auditors dora hipaa fine-tune fine-tuning finetune chatgpt openai anthropic copilot vendor vendors retention
""".split())


def _stem(w: str) -> str:
    if len(w) <= 3 or re.match(r"^[a-z]{2}-\d{2}$", w) or any(ch.isdigit() for ch in w):
        return w
    for suf, rep in (("ies", "y"), ("sses", "ss"), ("ing", ""), ("ed", ""), ("es", ""), ("s", "")):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[: -len(suf)] + rep
    return w


_TOKEN_RE = re.compile(r"[a-z]{2}-\d{2}|[a-z]+-q\d+|uc-[a-z]+-q\d+|a\.\d+(?:\.\d+)*|\d+(?:\.\d+)+|[a-z0-9]+")


def tokenize(text: str, *, expand: bool = False) -> list[str]:
    toks = []
    for t in _TOKEN_RE.findall((text or "").lower()):
        if t in STOPWORDS:
            continue
        toks.append(_stem(t))
        if expand and t in SYNONYMS:
            toks.extend(_stem(s) for s in SYNONYMS[t])
    return toks


@dataclass
class Doc:
    id: str
    kind: str
    title: str
    text: str
    source: str
    section: str = ""
    control_ids: list[str] = field(default_factory=list)
    question_ids: list[str] = field(default_factory=list)
    policy_id: str | None = None
    policy_version: str | None = None
    mappings: dict = field(default_factory=dict)
    boost: float = 1.0
    summary: str = ""   # human-readable one-liner used in answers (falls back to snippet extraction)

    def to_source(self) -> dict:
        d = {"type": self.kind, "id": self.id, "title": self.title, "path": self.source}
        if self.section:
            d["section"] = self.section
        if self.policy_id:
            d["policy_id"] = self.policy_id
            d["policy_version"] = self.policy_version
        return d


def _rel(p: Path) -> str:
    try:
        return str(p.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return str(p)


def real_control_ids(text: str) -> list[str]:
    known = controls_by_id()
    out = []
    for m in CONTROL_ID_RE.finditer(text or ""):
        cid = f"{m.group(1).upper()}-{m.group(2)}"
        if cid in known and cid not in out:
            out.append(cid)
    return out


# --------------------------------------------------------------------------- loaders
def _control_docs() -> list[Doc]:
    lib = load_control_library()
    ver = lib["library"]["version"]
    pillars = {p["id"]: p["name"] for p in lib["pillars"]}
    docs = []
    for c in lib["controls"]:
        maps = c.get("mappings", {}) or {}
        map_txt = "; ".join(f"{FRAMEWORK_LABELS.get(k, k)} {', '.join(map(str, v))}" for k, v in maps.items() if v)
        text = (f"{c['id']} {c['id']} {c['title']}. {c['title']}. Pillar: {pillars.get(c['pillar'], c['pillar'])}. "
                f"Objective: {c['objective']} Evidence: {'; '.join(c.get('evidence', []))}. "
                f"Owner: {c.get('owner_role', '')}. Priority: {c.get('priority', '')}. Applies to: {c.get('applies_to', '')}. "
                f"Domains: {', '.join(c.get('domains', []))}. Mappings: {map_txt}.")
        docs.append(Doc(id=c["id"], kind="control", title=f"{c['id']} {c['title']}", text=text,
                        source=_rel(CONTROLS_FILE), section=f"Control Library v{ver}", control_ids=[c["id"]],
                        mappings=maps, boost=1.25))
    return docs


def _maturity_docs() -> list[Doc]:
    if not ASSESSMENT_TEMPLATE_FILE.exists():
        return []
    t = yaml.safe_load(ASSESSMENT_TEMPLATE_FILE.read_text(encoding="utf-8"))
    ver = t.get("template", {}).get("version", "")
    docs = []
    for q in t.get("questions", []):
        docs.append(Doc(id=q["id"], kind="maturity_question", title=f"{q['id']}: {q['text']}",
                        text=f"{q['id']} {q['text']} Recommended action: {q.get('action', '')} Domain: {q.get('domain', '')}.",
                        source=_rel(ASSESSMENT_TEMPLATE_FILE), section=f"Maturity Self-Assessment v{ver}",
                        control_ids=list(q.get("controls", [])), question_ids=[q["id"]]))
    for f in t.get("critical_flags", []):
        docs.append(Doc(id=f["id"], kind="critical_flag", title=f"{f['id']}: {f['title']}",
                        text=f"{f['title']}. {f.get('rationale', '')}", source=_rel(ASSESSMENT_TEMPLATE_FILE),
                        section=f"Maturity Self-Assessment v{ver} critical flags", control_ids=list(f.get("controls", [])),
                        question_ids=[f["when"]["question"]] if isinstance(f.get("when"), dict) and f["when"].get("question") else []))
    return docs


def _use_case_docs() -> list[Doc]:
    if not USE_CASE_TEMPLATE_FILE.exists():
        return []
    t = yaml.safe_load(USE_CASE_TEMPLATE_FILE.read_text(encoding="utf-8"))
    ver = t.get("template", {}).get("version", "")
    docs = []
    for m in t.get("modules", []):
        for q in m.get("questions", []):
            docs.append(Doc(id=q["id"], kind="use_case_question", title=f"{q['id']}: {q['text']}",
                            text=(f"{q['id']} {q['text']} Module: {m['name']}. Evidence expected: "
                                  f"{'; '.join(q.get('evidence_expected', []))}. Remediation: {q.get('remediation', '')}"),
                            source=_rel(USE_CASE_TEMPLATE_FILE), section=f"Use-Case Assessment v{ver} / {m['name']}",
                            control_ids=list(q.get("controls", [])), question_ids=[q["id"]]))
    return docs


def _find_meta(data, keys: tuple[str, ...]) -> str | None:
    if not isinstance(data, dict):
        return None
    for k in keys:
        if k in data and isinstance(data[k], (str, int, float)):
            return str(data[k])
    for v in data.values():
        if isinstance(v, dict):
            for k in keys:
                if k in v and isinstance(v[k], (str, int, float)):
                    return str(v[k])
    return None


def _flatten(obj, prefix: str = "") -> list[str]:
    out = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            out.extend(_flatten(v, f"{k}"))
    elif isinstance(obj, list):
        for v in obj:
            out.extend(_flatten(v, prefix))
    elif obj is not None and not isinstance(obj, bool):
        s = str(obj).strip()
        if s:
            out.append(f"{prefix.replace('_', ' ')}: {s}" if prefix else s)
    return out


def _load_structured(path: Path):
    txt = path.read_text(encoding="utf-8")
    if path.suffix == ".json":
        return json.loads(txt)
    return yaml.safe_load(txt)


def _pack_docs(directory: Path, kind: str) -> list[Doc]:
    docs = []
    if not directory.exists():
        return docs
    for p in sorted(list(directory.glob("*.yaml")) + list(directory.glob("*.yml")) + list(directory.glob("*.json"))):
        try:
            data = _load_structured(p)
        except Exception:  # malformed / half-written file from a concurrent builder
            continue
        if not isinstance(data, dict):
            continue
        pid = _find_meta(data, ("policy_id", "pack_id", "id")) or p.stem
        ver = _find_meta(data, ("version", "policy_version"))
        title = _find_meta(data, ("policy_name", "name", "title")) or pid
        label = "runtime policy pack" if kind == "policy_pack" else "industry pack"
        # Header doc: identity + short scalar fields (summary/description), boosted so pack-level questions find it.
        head_parts = [f"{title} {label} {pid}"]
        for key, val in data.items():
            if isinstance(val, (str, int, float)) and not isinstance(val, bool):
                head_parts.append(f"{key.replace('_', ' ')}: {val}")
            elif isinstance(val, dict):
                head_parts += [f"{k2.replace('_', ' ')}: {v2}" for k2, v2 in val.items()
                               if isinstance(v2, (str, int, float)) and not isinstance(v2, bool)]
        head = ". ".join(head_parts)
        pol = {"policy_id": pid if kind == "policy_pack" else None, "policy_version": ver if kind == "policy_pack" else None}
        desc = _find_meta(data, ("description", "summary", "purpose"))
        docs.append(Doc(id=pid, kind=kind, title=f"{title} ({label})", text=head[:6000], source=_rel(p),
                        control_ids=real_control_ids(" ".join(_flatten(data))), boost=1.3,
                        summary=f"{title} ({label}{', status: ' + str(data.get('status')) if data.get('status') else ''}): "
                                f"{' '.join(str(desc).split())[:400]}" if desc else "", **pol))
        # Section docs: one per top-level structured key (e.g. priority_use_cases, tools, data_handling).
        for key, val in data.items():
            if isinstance(val, (list, dict)) and key not in ("rules",):
                stext = " ".join(_flatten(val))
                if len(stext) < 40:
                    continue
                docs.append(Doc(id=f"{pid}#{key}", kind=f"{kind}_section", title=f"{title} — {key.replace('_', ' ')}",
                                text=f"{title} {label} {key.replace('_', ' ')}. {stext}"[:8000], source=_rel(p),
                                section=key, control_ids=real_control_ids(stext), **pol))
        # Index individual rules (any list item with an id) so specific questions retrieve specific rules.
        for path, r in _rule_items(data):
            rid = str(r["id"])
            rtext = " ".join(_flatten(r))
            desc = str(r.get("description") or r.get("text") or r.get("name") or "").strip()
            bits = [x for x in (r.get("action"), r.get("tool"), r.get("type")) if isinstance(x, str)]
            cites = [c for c in (r.get("citations") or []) if isinstance(c, str)]
            summ = (f"rule {rid}" + (f" ({' '.join(bits)})" if bits else "") + (f": {desc}" if desc else "")
                    + (f" [{', '.join(cites)}]" if cites else ""))
            docs.append(Doc(id=f"{pid}#{rid}", kind=f"{kind}_rule", title=f"{title} — {rid}",
                            text=f"{title} {path.replace('.', ' ')} {rtext}"[:6000], source=_rel(p), section=f"{path}: {rid}",
                            control_ids=real_control_ids(rtext), summary=summ, boost=1.15, **pol))
    return docs


def _rule_items(data, path: str = "", depth: int = 0):
    """Yield (path, item) for dicts with an 'id' found inside lists (policy rules, transforms, use cases)."""
    if depth > 4:
        return
    if isinstance(data, dict):
        for k, v in data.items():
            yield from _rule_items(v, f"{path}.{k}" if path else k, depth + 1)
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and isinstance(item.get("id"), (str, int)):
                yield path, item
            elif isinstance(item, (dict, list)):
                yield from _rule_items(item, path, depth + 1)


_FRONT_RE = re.compile(r"^---\n.*?\n---\n", re.DOTALL)


def _markdown_docs(path: Path, kind: str) -> list[Doc]:
    try:
        txt = path.read_text(encoding="utf-8")
    except OSError:
        return []
    txt = _FRONT_RE.sub("", txt, count=1)
    chunks: list[tuple[str, list[str]]] = []
    title = path.stem.replace("_", " ").title()
    current, buf = title, []
    for line in txt.splitlines():
        m = re.match(r"^(#{1,4})\s+(.*)", line)
        if m:
            if any(b.strip() for b in buf):
                chunks.append((current, buf))
            current, buf = m.group(2).strip(), []
            if m.group(1) == "#":
                title = current
        else:
            buf.append(line)
    if any(b.strip() for b in buf):
        chunks.append((current, buf))
    docs = []
    for i, (sec, lines) in enumerate(chunks):
        body = "\n".join(lines).strip()
        docs.append(Doc(id=f"{path.stem}#{i + 1}", kind=kind, title=f"{title} — {sec}" if sec != title else title,
                        text=f"{sec}. {body}"[:8000], source=_rel(path), section=sec,
                        control_ids=real_control_ids(body)))
    return docs


def source_files() -> list[Path]:
    files = [CONTROLS_FILE, ASSESSMENT_TEMPLATE_FILE, USE_CASE_TEMPLATE_FILE]
    for d in (CONTENT_DIR / "policy_packs", CONTENT_DIR / "industry_packs"):
        if d.exists():
            files += sorted(list(d.glob("*.yaml")) + list(d.glob("*.yml")) + list(d.glob("*.json")))
    files += sorted(CONTENT_DIR.glob("*.md"))
    cm = DOCS_DIR / "COMPLIANCE_MAPPING.md"
    if cm.exists():
        files.append(cm)
    return [f for f in files if f.exists()]


def build_corpus() -> list[Doc]:
    docs = _control_docs() + _maturity_docs() + _use_case_docs()
    docs += _pack_docs(CONTENT_DIR / "policy_packs", "policy_pack")
    docs += _pack_docs(CONTENT_DIR / "industry_packs", "industry_pack")
    for p in sorted(CONTENT_DIR.glob("*.md")):
        docs += _markdown_docs(p, "content_doc")
    cm = DOCS_DIR / "COMPLIANCE_MAPPING.md"
    if cm.exists():
        docs += _markdown_docs(cm, "compliance_mapping")
    return docs


# --------------------------------------------------------------------------- BM25
class BM25Index:
    def __init__(self, docs: list[Doc], k1: float = 1.4, b: float = 0.75):
        self.docs = docs
        self.k1, self.b = k1, b
        self.tfs: list[Counter] = []
        df: Counter = Counter()
        for d in docs:
            toks = tokenize(d.title) * 2 + tokenize(d.text)
            tf = Counter(toks)
            self.tfs.append(tf)
            df.update(tf.keys())
        self.lens = [sum(tf.values()) for tf in self.tfs]
        self.avgdl = (sum(self.lens) / len(self.lens)) if self.lens else 1.0
        n = len(docs)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}

    def search(self, query: str, k: int = 8, kinds: set[str] | None = None) -> list[dict]:
        q_terms = tokenize(query, expand=True)
        base_terms = set(tokenize(query))
        if not q_terms:
            return []
        qtf = Counter(q_terms)
        results = []
        for i, d in enumerate(self.docs):
            if kinds and d.kind not in kinds:
                continue
            tf = self.tfs[i]
            score = 0.0
            for t, qn in qtf.items():
                f = tf.get(t)
                if not f:
                    continue
                w = 1.0 if t in base_terms else 0.4  # synonym expansions count less
                denom = f + self.k1 * (1 - self.b + self.b * self.lens[i] / self.avgdl)
                score += w * self.idf.get(t, 0.0) * f * (self.k1 + 1) / denom
            if score <= 0:
                continue
            score *= d.boost
            matched = {t for t in base_terms if t in tf or any(_stem(x) in tf for x in SYNONYMS.get(t, []))}
            coverage = len(matched) / max(1, len(base_terms))
            results.append({"doc": d, "score": round(score, 4), "coverage": round(coverage, 3), "matched": sorted(matched)})
        results.sort(key=lambda r: (-r["score"], r["doc"].id))
        return results[:k]


_INDEX_LOCK = threading.Lock()
_INDEX: dict = {"sig": None, "index": None}


def _signature() -> tuple:
    sig = []
    for f in source_files():
        try:
            st = f.stat()
            sig.append((str(f), st.st_mtime_ns, st.st_size))
        except OSError:
            continue
    return tuple(sig)


def get_index() -> BM25Index:
    sig = _signature()
    with _INDEX_LOCK:
        if _INDEX["index"] is None or _INDEX["sig"] != sig:
            _INDEX["index"] = BM25Index(build_corpus())
            _INDEX["sig"] = sig
        return _INDEX["index"]


def confidence_band(top: dict | None, query: str) -> tuple[str, float]:
    """Heuristic confidence from coverage of query terms and absolute BM25 score."""
    if not top:
        return "low", 0.0
    n_terms = len(set(tokenize(query)))
    cov, score = top["coverage"], top["score"]
    conf = round(min(1.0, 0.6 * cov + 0.4 * min(1.0, score / 12.0)), 3)
    if cov >= 0.5 and score >= 5.0:
        return "high", conf
    if (cov >= 0.34 and score >= 3.0) or (n_terms <= 2 and cov >= 0.5 and score >= 2.5):
        return "medium", conf
    return "low", conf


def in_governance_scope(text: str) -> bool:
    words = set(re.findall(r"[a-z0-9]+", (text or "").lower()))
    if CONTROL_ID_RE.search(text or "") or MATURITY_QID_RE.search(text or "") or UC_QID_RE.search(text or ""):
        return True
    return bool(words & GOVERNANCE_VOCAB)


# --------------------------------------------------------------------------- framework lookup
_EU_RE = re.compile(r"\b(?:art(?:icle)?s?\.?\s*)(\d{1,3})\b", re.IGNORECASE)
_ISO_ANNEX_RE = re.compile(r"\bA\.\d{1,2}(?:\.\d{1,2}){0,2}\b", re.IGNORECASE)
_ISO_CLAUSE_RE = re.compile(r"\b(?:clause|cl\.?|section)\s*(\d{1,2}(?:\.\d{1,2}){0,2})\b", re.IGNORECASE)
_ISO_BARE_RE = re.compile(r"(?<![\w.:/])\d{1,2}\.\d{1,2}(?:\.\d{1,2})?(?![\w.]*\d{3})\b")
_NIST_RE = re.compile(r"\b(GOVERN|MAP|MEASURE|MANAGE)(?:\s+(\d{1,2}(?:\.\d{1,2})?))?\b", re.IGNORECASE)


def detect_frameworks(text: str) -> set[str]:
    t = (text or "").lower()
    out = set()
    if re.search(r"\beu\s*ai\s*act\b|\bai act\b|regulation \(eu\) 2024/1689|\bartificial intelligence act\b", t):
        out.add("eu_ai_act")
    if re.search(r"\biso(/iec)?\s*42001\b|\b42001\b", t):
        out.add("iso_42001")
    if re.search(r"\bnist\b|\bai\s*rmf\b", t):
        out.add("nist_ai_rmf")
    if _NIST_RE.search(text or "") and re.search(r"\b(GOVERN|MEASURE|MANAGE)\b", text or ""):
        out.add("nist_ai_rmf")
    return out


def parse_framework_refs(text: str) -> list[tuple[str, str]]:
    """Extract (framework, reference) pairs, e.g. ('eu_ai_act','Art. 14'), ('iso_42001','A.6.2.8'),
    ('nist_ai_rmf','GOVERN 1.1'). References are only matched in a framework context."""
    fws = detect_frameworks(text)
    refs: list[tuple[str, str]] = []
    if "eu_ai_act" in fws or re.search(r"\barticle\s+\d", text or "", re.IGNORECASE):
        for m in _EU_RE.finditer(text or ""):
            refs.append(("eu_ai_act", f"Art. {int(m.group(1))}"))
    if "iso_42001" in fws or _ISO_ANNEX_RE.search(text or ""):
        for m in _ISO_ANNEX_RE.finditer(text or ""):
            refs.append(("iso_42001", m.group(0).upper().replace("A.", "A.")))
        for m in _ISO_CLAUSE_RE.finditer(text or ""):
            refs.append(("iso_42001", m.group(1)))
        if "iso_42001" in fws:
            nist_spans = [m.span() for m in _NIST_RE.finditer(text or "") if m.group(2)]
            for m in _ISO_BARE_RE.finditer(text or ""):
                if any(a <= m.start() < b for a, b in nist_spans):
                    continue
                refs.append(("iso_42001", m.group(0)))
    for m in _NIST_RE.finditer(text or ""):
        word = m.group(1)
        # "map"/"manage" are common English words: require upper case or a NIST context.
        if word.isupper() or "nist_ai_rmf" in fws:
            ref = word.upper() + (f" {m.group(2)}" if m.group(2) else "")
            refs.append(("nist_ai_rmf", ref))
    seen, out = set(), []
    for r in refs:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out


def _ref_matches(framework: str, wanted: str, actual: str) -> bool:
    a, w = str(actual).strip(), str(wanted).strip()
    if framework == "eu_ai_act":
        return a.lower() == w.lower()
    if framework == "nist_ai_rmf":
        a, w = a.upper(), w.upper()
        return a == w or a.startswith(w + ".") or a.startswith(w + " ")
    # ISO: exact or hierarchical prefix (A.6 matches A.6.2.8; 9 matches 9.1)
    a, w = a.upper(), w.upper()
    return a == w or a.startswith(w + ".")


def controls_for_framework_ref(framework: str, ref: str) -> list[dict]:
    out = []
    for c in load_control_library()["controls"]:
        for actual in (c.get("mappings", {}) or {}).get(framework, []) or []:
            if _ref_matches(framework, ref, actual):
                out.append(c)
                break
    return out


def controls_for_framework(framework: str) -> list[dict]:
    return [c for c in load_control_library()["controls"] if (c.get("mappings", {}) or {}).get(framework)]
