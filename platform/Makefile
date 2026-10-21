SHELL := /bin/bash
PY := python3
export PYTHONPATH := $(shell ls -d $(CURDIR)/app/*/ | tr '\n' ':')
PORT ?= 8080

.PHONY: help install test test-fast site serve samples verify-audit check clean package diagrams all

help:
	@echo "make install     - install Python dependencies"
	@echo "make test        - run the full test suite (unit, integration, agent-evaluation, policy-engine, security)"
	@echo "make site        - build the static website into app/website/dist"
	@echo "make serve       - run API + website on http://127.0.0.1:$(PORT)"
	@echo "make samples     - regenerate synthetic sample reports in output/sample_reports"
	@echo "make check       - content integrity + prohibited-claim scan"
	@echo "make verify-audit- verify hash chains of all audit logs in var/"

install:
	$(PY) -m pip install -r requirements.txt

test:
	$(PY) -m pytest -q

test-fast:
	$(PY) -m pytest -q -x tests/unit

site:
	$(PY) app/website/build.py

serve: site
	$(PY) -m aegis_api.server --port $(PORT)

samples:
	$(PY) -m aegis_agent.sample_run
	$(PY) -m aegis_shield samples
	$(PY) scripts/generate_samples.py
	$(PY) scripts/pilot_dry_run.py

check:
	$(PY) scripts/check_content.py

verify-audit:
	$(PY) -m aegis_admin.cli audit verify

package:
	$(PY) scripts/package.py

clean:
	rm -rf var app/website/dist .pytest_cache
	find . -name __pycache__ -type d -prune -exec rm -rf {} +

diagrams:
	$(PY) scripts/draw_architecture.py
	bash scripts/render_diagrams.sh

all: check samples site test package
