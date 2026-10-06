# Phase-diagram extraction (Slag Atlas + NSRDS-NBS 61) — targets
# Source files: shared/sources/compound-data/ (atlas and NBS PDFs, paths in sources.json)
# Working files: tmp/reports/python/phase-diagrams/ (/app/reports/phase-diagrams in the container),
#                including candidates/<system>.json written by pd-extract / pd-curves
# Dataset (proof layer): shared/processed/phase-diagrams/systems/*.json, written only by pd-promote
# Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md
# Implementation: python/src/phase_diagrams/

PD_CLI   := docker-compose run --rm python python src/scripts/extract_phase_diagram.py
PD_PAGES ?= 40-200
SCALE    ?= 1

.PHONY: pd-index pd-tile pd-calibrate pd-extract pd-curves pd-compare pd-promote pd-nbs-index pd-nbs-suggest pd-validate pd-test

pd-index: ## Caption OCR over the atlas → figure-index/slag-atlas-1995.json [PD_PAGES=40-200]
	@$(PD_CLI) index-figures --source slag-atlas-1995 --pages $(PD_PAGES)

pd-tile: ## Zoom tile with pixel rulers: PAGE=108 BOX="x0 y0 x1 y1" [SCALE=2]
	@test -n "$(PAGE)" -a -n "$(BOX)" || (echo "usage: make pd-tile PAGE=108 BOX=\"x0 y0 x1 y1\" [SCALE=2]"; exit 2)
	@$(PD_CLI) tile --page $(PAGE) --box $(BOX) --scale $(SCALE)

pd-calibrate: ## Detect frame and ticks of a binary config: SYSTEM=mgo-sio2
	@test -n "$(SYSTEM)" || (echo "usage: make pd-calibrate SYSTEM=mgo-sio2"; exit 2)
	@$(PD_CLI) calibrate $(SYSTEM)

pd-extract: ## Binary config → candidates/<system>.json, overlay, review, comparison: SYSTEM=mgo-sio2
	@test -n "$(SYSTEM)" || (echo "usage: make pd-extract SYSTEM=mgo-sio2"; exit 2)
	@$(PD_CLI) extract $(SYSTEM)

pd-curves: ## Ternary curves config → candidate with polyline_wt filled: SYSTEM=cao-mgo-sio2
	@test -n "$(SYSTEM)" || (echo "usage: make pd-curves SYSTEM=cao-mgo-sio2"; exit 2)
	@$(PD_CLI) trace-curves $(SYSTEM)

pd-compare: ## Compare the candidate with the dataset file: SYSTEM=mgo-sio2
	@test -n "$(SYSTEM)" || (echo "usage: make pd-compare SYSTEM=mgo-sio2"; exit 2)
	@$(PD_CLI) compare $(SYSTEM)

pd-promote: ## Copy the validated candidate into the dataset (after review): SYSTEM=mgo-sio2
	@test -n "$(SYSTEM)" || (echo "usage: make pd-promote SYSTEM=mgo-sio2"; exit 2)
	@$(PD_CLI) promote $(SYSTEM)

pd-nbs-index: ## Dump and parse NSRDS-NBS 61 → nbs/
	@$(PD_CLI) nbs-index

pd-nbs-suggest: ## Candidate NBS entries: COMPONENTS="MgO SiO2"
	@test -n "$(COMPONENTS)" || (echo "usage: make pd-nbs-suggest COMPONENTS=\"MgO SiO2\""; exit 2)
	@$(PD_CLI) nbs-suggest $(COMPONENTS)

pd-validate: ## Validate the phase-diagram dataset (exit 1 on errors)
	@$(PD_CLI) validate

pd-test: ## Run phase-diagram extraction tests (in python container)
	@echo "🧪 Running phase-diagram extraction tests..."
	@docker-compose run --rm python python -m pytest /app/tests/phase_diagrams/ -v
	@echo ""
	@echo "✅ Phase-diagram tests completed."
