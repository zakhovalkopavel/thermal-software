# NIST-JANAF table parser — targets
# Source files: shared/sources/compound-data/nist-janaf/ (py-janaf copy + NIST originals)
# Output files: shared/processed/JANAF/{inorganic/<Element>,organic/<family>}/<formula>-<name>.json,
#               index.json, units.json, sources.json (the folder is cleared first)
# Organic families come from shared/processed/compound-data/index.json: run compound-data-build first
# Spec: docs/scripts/JANAF_PARSER_SPEC.md
# Implementation: python/src/janaf/

JANAF_OUT := shared/processed/JANAF

.PHONY: janaf-parse janaf-test

janaf-parse: ## Parse NIST-JANAF tables → shared/processed/JANAF/ (one file per compound; run compound-data-build first)
	@echo "🔬 Parsing NIST-JANAF tables..."
	@docker-compose run --rm python python src/scripts/parse_janaf.py --out-dir $(JANAF_OUT)
	@echo "✅ Done → $(JANAF_OUT)/"

janaf-test: ## Run JANAF parser and dataset layout unit tests (in python container)
	@echo "🧪 Running JANAF parser tests..."
	@docker-compose run --rm python python -m pytest /app/tests/janaf/ /app/tests/dataset_layout/ -v
