# NIST-JANAF table parser — targets
# Source files: shared/sources/compound-data/nist-janaf/ (py-janaf copy + NIST originals)
# Output files: shared/processed/JANAF/<prefix>.json, index.json (full runs only)
# Spec: docs/scripts/JANAF_PARSER_SPEC.md
# Implementation: python/src/janaf/

JANAF_OUT := shared/processed/JANAF

.PHONY: janaf-parse janaf-test

janaf-parse: ## Parse NIST-JANAF tables → shared/processed/JANAF/<prefix>.json + index.json [PREFIXES=Al,O, skips index]
	@echo "🔬 Parsing NIST-JANAF tables..."
	@docker-compose run --rm python python src/scripts/parse_janaf.py \
		--out-dir $(JANAF_OUT) $(if $(PREFIXES),--prefixes $(PREFIXES))
	@echo "✅ Done → $(JANAF_OUT)/"

janaf-test: ## Run JANAF parser unit tests (in python container)
	@echo "🧪 Running JANAF parser tests..."
	@docker-compose run --rm python python -m pytest /app/tests/janaf/ -v
