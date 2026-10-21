"""API security tests: traversal, oversize payloads, content-type, rate limiting, input sanitisation."""
import json

import pytest

from aegis_api.server import MAX_BODY, AegisApp


@pytest.fixture()
def app(tmp_path):
    site = tmp_path / "site"
    site.mkdir()
    (site / "index.html").write_text("ok")
    (tmp_path / "secret.txt").write_text("TOP SECRET")
    return AegisApp(var_dir=tmp_path / "var", site_dir=site)


@pytest.mark.parametrize("p", ["/../secret.txt", "/%2e%2e/secret.txt", "/..%2fsecret.txt", "/./../secret.txt",
                               "/../var/secret.key"])
def test_path_traversal_blocked(app, p):
    s, _, b = app.handle("GET", p)
    assert b"TOP SECRET" not in b
    assert s in (404, 503)


def test_oversize_payload(app):
    s, _, _ = app.handle("POST", "/api/contact", {"Content-Type": "application/json"}, b"x" * (MAX_BODY + 1))
    assert s == 413


def test_wrong_content_type(app):
    s, _, _ = app.handle("POST", "/api/contact", {"Content-Type": "application/x-www-form-urlencoded"}, b"a=b")
    assert s == 415


@pytest.mark.parametrize("body", [b"not json", b"[1,2]", b"\xff\xfe"])
def test_malformed_json(app, body):
    s, _, _ = app.handle("POST", "/api/contact", {"Content-Type": "application/json"}, body)
    assert s == 400


def test_rate_limit(tmp_path, monkeypatch):
    monkeypatch.setenv("AEGIS_RATE_LIMIT", "5")
    app = AegisApp(var_dir=tmp_path / "v", site_dir=tmp_path)
    codes = [app.handle("POST", "/api/events", {"Content-Type": "application/json"},
                        json.dumps({"name": "page_view", "path": "/"}).encode(), client="1.2.3.4")[0] for _ in range(7)]
    assert codes[:5] == [204] * 5 and codes[5:] == [429, 429]
    # another client is unaffected
    assert app.handle("POST", "/api/events", {"Content-Type": "application/json"},
                      json.dumps({"name": "page_view", "path": "/"}).encode(), client="5.6.7.8")[0] == 204


@pytest.mark.parametrize("email", ["a@b", "no-at-sign", "x@y.z", "a b@corp.example", "<script>@corp.example",
                                   "a@corp.example\r\nBcc: victim@corp.example"])
def test_email_validation_blocks_injection(app, email):
    s, _, _ = app.handle("POST", "/api/contact", {"Content-Type": "application/json"},
                         json.dumps({"form": "contact", "email": email, "name": "x", "consent": True}).encode())
    assert s == 422


def test_control_characters_stripped(app):
    s, _, b = app.handle("POST", "/api/contact", {"Content-Type": "application/json"},
                         json.dumps({"form": "contact", "email": "a@corp.example", "name": "Eve\x00\x1b[31m", "consent": True,
                                     "message": "hi"}).encode())
    assert s == 201
    rec = json.loads((app.var / "forms" / "submissions.jsonl").read_text().splitlines()[-1])
    assert "\x00" not in rec["name"] and "\x1b" not in rec["name"]


def test_unknown_api_route_and_method(app):
    assert app.handle("GET", "/api/admin/leads")[0] == 404
    assert app.handle("DELETE", "/api/leads")[0] == 405
    assert app.handle("PUT", "/")[0] == 405


def test_session_id_validation(app):
    s, _, _ = app.handle("POST", "/api/agent/message", {"Content-Type": "application/json"},
                         json.dumps({"message": "hi", "session_id": "../../etc"}).encode())
    assert s in (422, 503)
