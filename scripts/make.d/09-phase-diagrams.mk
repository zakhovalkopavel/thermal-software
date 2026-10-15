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

.PHONY: pd-index pd-tile pd-calibrate pd-extract pd-new pd-curves pd-nodes pd-isotherms pd-auto-overlay pd-auto pd-compare pd-promote pd-nbs-index pd-nbs-suggest pd-validate pd-test

pd-index: ## Caption OCR over the atlas → figure-index/slag-atlas-1995.json [PD_PAGES=40-200]
	@$(PD_CLI) index-figures --source slag-atlas-1995 --pages $(PD_PAGES)

pd-tile: ## Zoom tile with pixel rulers: PAGE=108 BOX="x0 y0 x1 y1" [SCALE=2] [OVERLAY=mgo-sio2]
	@test -n "$(PAGE)" -a -n "$(BOX)" || (echo "usage: make pd-tile PAGE=108 BOX=\"x0 y0 x1 y1\" [SCALE=2] [OVERLAY=system]"; exit 2)
	@$(PD_CLI) tile --page $(PAGE) --box $(BOX) --scale $(SCALE) $(if $(OVERLAY),--overlay $(OVERLAY))

pd-calibrate: ## Detect frame and ticks of a binary config: SYSTEM=mgo-sio2
	@test -n "$(SYSTEM)" || (echo "usage: make pd-calibrate SYSTEM=mgo-sio2"; exit 2)
	@$(PD_CLI) calibrate $(SYSTEM)

pd-extract: ## Binary config → candidates/<system>.json, overlay, review, comparison: SYSTEM=mgo-sio2
	@test -n "$(SYSTEM)" || (echo "usage: make pd-extract SYSTEM=mgo-sio2"; exit 2)
	@$(PD_CLI) extract $(SYSTEM)

pd-new: ## New ternary: figure from the index, triangle calibration → starting file + curves config: SYSTEM=cao-feox-sio2 [FIGURE=3.226] [TRIANGLE=1] [CORNERS="SiO2 CaO FeOx"] [PUBCHEM=1]
	@test -n "$(SYSTEM)" || (echo "usage: make pd-new SYSTEM=cao-feox-sio2 [FIGURE=3.226] [TRIANGLE=1] [CORNERS=\"top left right\"] [PUBCHEM=1]"; exit 2)
	@$(PD_CLI) new $(SYSTEM) $(if $(FIGURE),--figure $(FIGURE)) $(if $(TRIANGLE),--triangle $(TRIANGLE)) $(if $(CORNERS),--corners $(CORNERS)) $(if $(PUBCHEM),--pubchem)

pd-curves: ## Ternary curves config → candidate with polyline_wt filled: SYSTEM=cao-mgo-sio2
	@test -n "$(SYSTEM)" || (echo "usage: make pd-curves SYSTEM=cao-mgo-sio2"; exit 2)
	@$(PD_CLI) trace-curves $(SYSTEM)

pd-nodes: ## Numbered node map of a ternary (junctions, edge points, invariants, rings) + topology report → nodes/: SYSTEM=cao-mgo-sio2 [ORIGIN="x y"]
	@test -n "$(SYSTEM)" || (echo "usage: make pd-nodes SYSTEM=cao-mgo-sio2 [ORIGIN=\"x y\"]"; exit 2)
	@$(PD_CLI) nodes $(SYSTEM) $(if $(ORIGIN),--origin $(ORIGIN))

pd-isotherms: ## Isotherms detected on the page (after pd-curves) → isotherms/: draft config entries, report vs the config, image: SYSTEM=na2o-al2o3-sio2 [STEP=100]
	@test -n "$(SYSTEM)" || (echo "usage: make pd-isotherms SYSTEM=na2o-al2o3-sio2 [STEP=100]"; exit 2)
	@$(PD_CLI) detect-isotherms $(SYSTEM) $(if $(STEP),--step $(STEP))

pd-auto-overlay: ## Overlay from automatic data only (detected isotherms, field approximation, compound rings; after pd-curves) → auto/: SYSTEM=na2o-al2o3-sio2 [STEP=100]
	@test -n "$(SYSTEM)" || (echo "usage: make pd-auto-overlay SYSTEM=na2o-al2o3-sio2 [STEP=100]"; exit 2)
	@$(PD_CLI) auto-overlay $(SYSTEM) $(if $(STEP),--step $(STEP))

pd-auto: ## Fully automatic ternary from the page alone (no config, no semi-manual data) → auto-full/: system, overlay, report vs the semi-manual file: SYSTEM=na2o-al2o3-sio2 [FIGURE=3.196] [TRIANGLE=1] [CORNERS="SiO2 Na2O Al2O3"] [STEP=100]
	@test -n "$(SYSTEM)" || (echo "usage: make pd-auto SYSTEM=na2o-al2o3-sio2 [FIGURE=3.196] [TRIANGLE=1] [CORNERS=\"top left right\"] [STEP=100]"; exit 2)
	@$(PD_CLI) auto $(SYSTEM) $(if $(FIGURE),--figure $(FIGURE)) $(if $(TRIANGLE),--triangle $(TRIANGLE)) $(if $(CORNERS),--corners $(CORNERS)) $(if $(STEP),--step $(STEP))

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

pd-validate: ## Validate the phase-diagram dataset (exit 1 on errors) [SYSTEM=k2o-al2o3-sio2: with that candidate in place]
	@$(PD_CLI) validate $(if $(SYSTEM),--candidate $(SYSTEM))

pd-test: ## Run phase-diagram extraction tests (in python container)
	@echo "🧪 Running phase-diagram extraction tests..."
	@docker-compose run --rm python python -m pytest /app/tests/phase_diagrams/ -v
	@echo ""
	@echo "✅ Phase-diagram tests completed."
