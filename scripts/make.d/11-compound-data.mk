# Compound data builder (CalebBell/chemicals tables) — targets
# Step 1, compound-data-build (offline): chemicals tables + JANAF ids + PubChem files → compound JSON,
#         and the CAS numbers the chemicals identifier files miss → $(COMPOUND_DATA_MISSING_CAS)
# Step 2, compound-data-pubchem (slow, resumable): those CAS numbers and the records without a CAS (by formula)
#         → PubChem → class files (does not rebuild compound data)
# On demand, pubchem-search Q="CaAl2O4" (or QUERY_FILE=shared/sources/pubchem-queries.txt): formula / name / CAS
#         → PubChem → printed and kept in the class files
# Source files: shared/sources/compound-data/chemicals/ (chemicals repo copy + PROVENANCE.txt),
#               shared/sources/compound-data/nist-janaf/ (JANAF table ids),
#               shared/sources/NASA/ (NASA-7 / NASA-9 species keys, checked by ΔfH°(298.15)),
#               shared/sources/compound-data/pubchem/pubchem-{inorganic,organic,unclassified}.jsonl (step 2: one line
#               per CAS or formula search with the full property answer and the PUG View experimental properties of its CIDs),
#               shared/sources/transport-parameters.json (White, TN D-481, Mamedov 2014, Svehla 1995)
# Output files: shared/processed/compound-data/{inorganic/<Element>,organic/<family>}/<formula>-<name>.json,
#               unresolved.json, index.json, units.json, sources.json, interactions.json (the folder is cleared first)
# Report: tmp/reports/python/compound-data/report.json, missing-cas.txt
# Spec: docs/scripts/COMPOUND_DATA_SPEC.md
# Implementation: python/src/chemical_formula/, chemicals_tables/, pubchem/, dataset_layout/, nasa_thermo/, compound_data/

COMPOUND_DATA_OUT := shared/processed/compound-data
COMPOUND_DATA_MISSING_CAS := tmp/reports/python/compound-data/missing-cas.txt
PUBCHEM_ARGS ?=
Q ?=
QUERY_FILE ?=
COMPOUND_DATA_TESTS := /app/tests/chemical_formula/ /app/tests/chemicals_tables/ /app/tests/pubchem/ \
	/app/tests/dataset_layout/ /app/tests/compound_data/

.PHONY: compound-data-build compound-data-test compound-data-pubchem pubchem-search

compound-data-build: ## Step 1: build compound JSON from the chemicals tables (offline) → shared/processed/compound-data/
	@echo "🧪 Building compound data..."
	@docker-compose run --rm python python src/scripts/build_compound_data.py \
		--out-dir $(COMPOUND_DATA_OUT)
	@echo "✅ Done → $(COMPOUND_DATA_OUT)/ (report: tmp/reports/python/compound-data/report.json)"

compound-data-pubchem: ## Step 2: look up in PubChem the CAS numbers step 1 could not identify and search the records without a CAS by formula (slow, resumable); PUBCHEM_ARGS="--class inorganic unclassified" / "--all-cas --class organic"
	@[ -f $(COMPOUND_DATA_MISSING_CAS) ] || $(MAKE) compound-data-build
	@echo "🧪 Fetching PubChem data $(PUBCHEM_ARGS) (stored queries are skipped; a PubChem block stops the run)..."
	@docker-compose run --rm python python src/scripts/fetch_pubchem_identifiers.py $(PUBCHEM_ARGS)
	@echo "✅ Done → shared/sources/compound-data/pubchem/pubchem-{inorganic,organic,unclassified}.jsonl"

pubchem-search: ## Search PubChem on demand (formula, name or CAS) and keep the answers: Q="CaAl2O4" / Q="'Ca3SiO5' '12042-68-1'" / QUERY_FILE=shared/sources/pubchem-queries.txt; PUBCHEM_ARGS="--refresh"
	@[ -n "$(Q)$(QUERY_FILE)" ] || { echo "Usage: make pubchem-search Q=\"CaAl2O4\" | QUERY_FILE=shared/sources/pubchem-queries.txt [PUBCHEM_ARGS=\"--by name --refresh\"]"; exit 1; }
	@docker-compose run --rm python python src/scripts/pubchem_search.py $(Q) $(if $(QUERY_FILE),--query-file $(QUERY_FILE)) $(PUBCHEM_ARGS)

compound-data-test: ## Run chemical_formula, chemicals_tables, pubchem, dataset_layout and compound_data unit tests (in python container)
	@echo "🧪 Running compound data tests..."
	@docker-compose run --rm python python -m pytest $(COMPOUND_DATA_TESTS) -v
