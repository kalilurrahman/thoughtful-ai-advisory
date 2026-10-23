"""Unit tests: BM25 retrieval, framework reference parsing, keyword extraction."""
from __future__ import annotations

from veritrail_common.content import controls_by_id

from veritrail_agent import knowledge as k
from veritrail_agent.extraction import extract_profile, parse_field_assignments, parse_field_value


def test_index_covers_controls_and_questions():
    idx = k.get_index()
    kinds = {d.kind for d in idx.docs}
    assert {"control", "maturity_question", "use_case_question"} <= kinds
    assert sum(1 for d in idx.docs if d.kind == "control") == len(controls_by_id())


def test_index_only_carries_real_control_ids():
    known = controls_by_id()
    for d in k.get_index().docs:
        assert all(c in known for c in d.control_ids), d.id


def test_policy_packs_indexed_with_id_and_version_when_present():
    docs = [d for d in k.get_index().docs if d.kind == "policy_pack"]
    for d in docs:
        assert d.policy_id and d.policy_version, d.id


def test_search_ranks_obvious_control_first():
    idx = k.get_index()
    assert idx.search("least privilege tool access for agents", 3)[0]["doc"].id == "IS-11"
    assert idx.search("kill switch rollback", 3)[0]["doc"].id in {"IS-15", "UC-SEC-Q3"}
    assert idx.search("prompt injection testing", 3)[0]["doc"].control_ids[0] in {"IS-14"}


def test_confidence_low_for_unrelated_query():
    res = k.get_index().search("lasagna recipe with basil", 3)
    band, _ = k.confidence_band(res[0] if res else None, "lasagna recipe with basil")
    assert band == "low"
    assert not k.in_governance_scope("lasagna recipe with basil")
    assert k.in_governance_scope("what does IS-11 require")


def test_markdown_chunking(tmp_path):
    p = tmp_path / "doc.md"
    p.write_text("---\ntitle: x\n---\n# Title\nIntro text here.\n## Section A\nAlpha mentions IS-11 and IS-99.\n## Section B\nBeta.\n")
    docs = k._markdown_docs(p, "content_doc")
    assert [d.section for d in docs] == ["Title", "Section A", "Section B"]
    assert docs[1].control_ids == ["IS-11"]  # IS-99 is not a real control and is never carried


def test_framework_ref_parsing():
    assert k.parse_framework_refs("Which controls map to EU AI Act Article 14?") == [("eu_ai_act", "Art. 14")]
    assert ("iso_42001", "A.6.2.8") in k.parse_framework_refs("ISO 42001 A.6.2.8")
    assert ("nist_ai_rmf", "GOVERN 1.1") in k.parse_framework_refs("NIST AI RMF GOVERN 1.1")
    assert ("iso_42001", "9.1") in k.parse_framework_refs("ISO/IEC 42001 clause 9.1")
    assert k.parse_framework_refs("we need to map our data flows") == []  # 'map' alone is not NIST MAP


def test_controls_for_framework_ref_uses_only_library_mappings():
    art14 = {c["id"] for c in k.controls_for_framework_ref("eu_ai_act", "Art. 14")}
    assert {"IS-09", "IS-13", "IS-15"} <= art14
    assert k.controls_for_framework_ref("eu_ai_act", "Art. 99") == []
    gov = {c["id"] for c in k.controls_for_framework_ref("nist_ai_rmf", "GOVERN 1")}
    assert "AO-01" in gov and all(any(m.startswith("GOVERN 1.") for m in c["mappings"]["nist_ai_rmf"])
                                  for c in k.controls_for_framework_ref("nist_ai_rmf", "GOVERN 1"))


def test_extract_profile_customer_support_agent():
    p = extract_profile("A customer-support agent called HelpBot that reads CRM data, drafts replies to customers and "
                        "can issue refunds with supervisor approval, using GPT-4 via Azure OpenAI for EU customers.")
    assert p["name"] == "HelpBot"
    assert p["domain_category"] == "customer_service"
    assert p["data_sensitivity"] == "personal"
    assert p["affected_parties"] == "customers"
    assert p["autonomy"] == "acts_with_approval"
    assert p["external_actions"] is True and p["genai"] is True and p["vendor_model"] is True and p["eu_exposure"] is True
    assert {"crm", "payments"} <= set(p["tools"])


def test_extract_profile_is_conservative():
    p = extract_profile("An internal tool.")
    assert "autonomy" not in p and "data_sensitivity" not in p and "decision_impact" not in p


def test_parse_field_value_and_assignments():
    assert parse_field_value("external_actions", "yes it can") is True
    assert parse_field_value("eu_exposure", "no") is False
    assert parse_field_value("autonomy", "acts with approval") == "acts_with_approval"
    assert parse_field_value("data_sensitivity", "maybe") is None
    assert parse_field_assignments("data_sensitivity: confidential; autonomy = suggests") == {
        "data_sensitivity": "confidential", "autonomy": "suggests"}
