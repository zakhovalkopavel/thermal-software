# USGS Bulletin 2131 (Robie & Hemingway 1995) — Modal/local page-ocr staging
# Source: shared/sources/compound-data/USGS Bulletin 2131 … (Robie Hemingway 1995).pdf
# OCR dumps: tmp/reports/python/usgs-bulletin-2131/ocr/
# Spec: docs/scripts/USGS_BULLETIN_2131_SPEC.md

USGS2131_PDF := shared/sources/compound-data/USGS Bulletin 2131 Thermodynamic properties of minerals (Robie Hemingway 1995).pdf
USGS2131_REPORT := tmp/reports/python/usgs-bulletin-2131
USGS2131_PROCESSED := shared/processed/minerals-thermodynamic/robie-hemingway-1995

.PHONY: usgs2131-ocr usgs2131-ocr-smoke usgs2131-ocr-missing usgs2131-list-missing \
	usgs2131-build usgs2131-verify usgs2131-test

# BACKEND=local|modal overrides PAGE_OCR_BACKEND for this run only.
# PAGE=459 (or PAGE="7 8 9") limits OCR; default = all pages in page-selections.json.
# Existing page-NNNN.txt dumps are skipped unless FORCE=1.
usgs2131-ocr: ## OCR USGS 2131 selected pages [BACKEND=local|modal] [PAGE=] [QUANT=] [DPI=300] [FORCE=1]
	@echo "🧪 USGS 2131 OCR (PAGE_OCR_BACKEND=$(or $(BACKEND),from .env))…"
	@docker compose run --rm \
		$(if $(BACKEND),-e PAGE_OCR_BACKEND=$(BACKEND)) \
		python python src/scripts/usgs2131_ocr.py \
		--pdf "/app/$(USGS2131_PDF)" \
		--report-dir /app/reports/usgs-bulletin-2131 \
		$(if $(PAGE),$(foreach p,$(PAGE),--page $(p))) \
		$(if $(QUANT),--quant $(QUANT)) \
		$(if $(DPI),--dpi $(DPI)) \
		$(if $(FORCE),--force)
	@echo "✅ → $(USGS2131_REPORT)/ocr/"

usgs2131-ocr-smoke: ## Smoke one USGS 2131 page via page-ocr [BACKEND=local|modal] [PAGE=459] [QUANT=]
	@echo "🧪 USGS 2131 OCR smoke…"
	@docker compose run --rm \
		-e PAGE_OCR_BACKEND=$(or $(BACKEND),local) \
		python python src/scripts/usgs2131_ocr.py \
		--pdf "/app/$(USGS2131_PDF)" \
		--report-dir /app/reports/usgs-bulletin-2131 \
		--page $(or $(PAGE),459) \
		$(if $(QUANT),--quant $(QUANT)) \
		$(if $(FORCE),--force)
	@echo "✅ → $(USGS2131_REPORT)/ocr/page-$(or $(PAGE),459).txt"

# Refresh full-bulletin selections, then OCR only pages that lack page-NNNN.txt.
usgs2131-ocr-missing: ## Modal/local OCR of pages not yet dumped [BACKEND=modal]
	@echo "🧪 USGS 2131 OCR missing pages only…"
	@MISSING=$$(docker compose run --rm python python src/scripts/usgs2131_list_missing_ocr.py --write-selections); \
	if [ -z "$$MISSING" ]; then echo "✅ nothing missing"; exit 0; fi; \
	echo "missing: $$MISSING"; \
	$(MAKE) usgs2131-ocr BACKEND=$(or $(BACKEND),modal) PAGE="$$MISSING"

usgs2131-list-missing: ## Print PDF pages not yet OCR'd (space-separated)
	@docker compose run --rm python python src/scripts/usgs2131_list_missing_ocr.py --write-selections

usgs2131-build: ## Build per-phase <phaseId>.json at staging root → processed/
	@echo "🧪 USGS 2131 per-phase staging…"
	@docker compose run --rm python python src/scripts/usgs2131_build.py
	@echo "✅ → $(USGS2131_PROCESSED)/<phaseId>.json"

usgs2131-verify: ## Summarize RobieHemingway1995 per-phase staging statuses
	@docker compose run --rm python python -c "import json; from pathlib import Path; from collections import Counter; d=Path('/app/shared/processed/minerals-thermodynamic/robie-hemingway-1995'); files=sorted(p for p in d.glob('*.json') if p.name!='phases.json'); rows=[json.loads(p.read_text()) for p in files]; print(json.dumps({'nFiles':len(files),'withHighT':sum(1 for r in rows if (r.get('highT') or {}).get('rows')),'statuses':dict(Counter(r.get('status') for r in rows))}, indent=2))"

usgs2131-test: ## Unit tests for USGS 2131 / Robie compact parser
	@docker compose run --rm python python -m pytest /app/tests/thermodynamic_staging/test_robie_parse.py /app/tests/thermodynamic_staging/test_robie_compound_overlay.py -q

# Robie → compound-data is part of ``make compound-data-build`` (minerals-thermodynamic overlay).
