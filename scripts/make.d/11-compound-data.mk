# Compound data builder (CalebBell/chemicals tables) — targets
# Step 1, compound-data-build (offline): chemicals tables + JANAF ids + PubChem cache → compound JSON,
#         and the CAS numbers the chemicals identifier files miss → $(COMPOUND_DATA_MISSING_CAS)
# Step 2, compound-data-pubchem (slow, resumable): those CAS numbers → PubChem → cache, then step 1 again
# Source files: shared/sources/compound-data/chemicals/ (chemicals repo copy + PROVENANCE.txt),
#               shared/sources/compound-data/nist-janaf/ (JANAF table ids),
#               shared/sources/NASA/ (NASA-7 / NASA-9 species keys, checked by ΔfH°(298.15)),
#               shared/sources/compound-data/pubchem/pubchem-cas.tsv (PubChem identifier cache, step 2)
# Output files: shared/processed/compound-data/{inorganic/<Element>,organic/<family>}/<formula>-<name>.json,
#               unresolved.json, index.json, units.json, sources.json (the folder is cleared first)
# Report: tmp/reports/python/compound-data/report.json, missing-cas.txt
# Spec: docs/scripts/COMPOUND_DATA_SPEC.md
# Implementation: python/src/chemical_formula/, chemicals_tables/, pubchem/, dataset_layout/, nasa_thermo/, compound_data/

COMPOUND_DATA_OUT := shared/processed/compound-data
COMPOUND_DATA_MISSING_CAS := tmp/reports/python/compound-data/missing-cas.txt
COMPOUND_DATA_TESTS := /app/tests/chemical_formula/ /app/tests/chemicals_tables/ /app/tests/pubchem/ \
	/app/tests/dataset_layout/ /app/tests/compound_data/

.PHONY: compound-data-build compound-data-test compound-data-pubchem

compound-data-build: ## Step 1: build compound JSON from the chemicals tables (offline) → shared/processed/compound-data/
	@echo "🧪 Building compound data..."
	@docker-compose run --rm python python src/scripts/build_compound_data.py \
		--out-dir $(COMPOUND_DATA_OUT)
	@echo "✅ Done → $(COMPOUND_DATA_OUT)/ (report: tmp/reports/python/compound-data/report.json)"

compound-data-pubchem: ## Step 2: look up in PubChem the CAS numbers step 1 could not identify (slow, resumable), then rebuild
	@[ -f $(COMPOUND_DATA_MISSING_CAS) ] || $(MAKE) compound-data-build
	@echo "🧪 Fetching PubChem identifiers (cached CAS numbers are skipped; a PubChem block stops the run)..."
	@docker-compose run --rm python python src/scripts/fetch_pubchem_identifiers.py
	@echo "✅ Cache → shared/sources/compound-data/pubchem/pubchem-cas.tsv"
	@$(MAKE) compound-data-build

compound-data-test: ## Run chemical_formula, chemicals_tables, pubchem, dataset_layout and compound_data unit tests (in python container)
	@echo "🧪 Running compound data tests..."
	@docker-compose run --rm python python -m pytest $(COMPOUND_DATA_TESTS) -v
