# NASA thermodynamic database parser — targets
# Source files: shared/sources/NASA/
# Output files: shared/processed/nasa7.json, nasa9.json
# Spec: docs/scripts/NASA_THERMO_PARSER_SPEC.md
# Implementation: python/src/nasa_thermo/

NASA7_SRC  := shared/sources/NASA/nasa7-origin.dat
NASA9_SRC1 := shared/sources/NASA/nasa9-origin.dat
NASA9_SRC2 := shared/sources/NASA/nasa9-new.dat
NASA_OUT   := shared/processed/NASA

.PHONY: nasa-parse nasa-parse-nasa7 nasa-parse-nasa9 nasa-parse-gaseous nasa-test nasa-test-all

nasa-parse: ## Parse all NASA thermo databases → shared/processed/nasa7.json + nasa9.json
	@echo "🔬 Parsing NASA-7 and NASA-9 thermodynamic databases..."
	@docker-compose run --rm python python src/scripts/parse_nasa_thermo.py \
		--nasa7  $(NASA7_SRC) \
		--nasa9  $(NASA9_SRC1) $(NASA9_SRC2) \
		--out-dir $(NASA_OUT)
	@echo ""
	@echo "✅ Done. Check $(NASA_OUT)/nasa7.json and $(NASA_OUT)/nasa9.json"

nasa-parse-nasa7: ## Parse NASA-7 only → shared/processed/nasa7.json
	@echo "🔬 Parsing NASA-7 (SP-273) database..."
	@docker-compose run --rm python python src/scripts/parse_nasa_thermo.py \
		--nasa7  $(NASA7_SRC) \
		--out-dir $(NASA_OUT)
	@echo "✅ Done → $(NASA_OUT)/nasa7.json"

nasa-parse-nasa9: ## Parse NASA-9 only → shared/processed/nasa9.json
	@echo "🔬 Parsing NASA-9 (RP-1311 + Burcat ANL-05/20) database..."
	@docker-compose run --rm python python src/scripts/parse_nasa_thermo.py \
		--nasa9  $(NASA9_SRC1) $(NASA9_SRC2) \
		--out-dir $(NASA_OUT)
	@echo "✅ Done → $(NASA_OUT)/nasa9.json"

nasa-parse-gaseous: ## Parse all NASA databases, gaseous-phase species only
	@echo "🔬 Parsing NASA databases (gaseous species only)..."
	@docker-compose run --rm python python src/scripts/parse_nasa_thermo.py \
		--nasa7  $(NASA7_SRC) \
		--nasa9  $(NASA9_SRC1) $(NASA9_SRC2) \
		--out-dir $(NASA_OUT) \
		--only-gaseous
	@echo "✅ Done (gaseous only) → $(NASA_OUT)/"

nasa-test: ## Run NASA thermo parser unit tests (in python container)
	@echo "🧪 Running NASA thermo parser tests..."
	@docker-compose run --rm python python -m pytest /app/tests/nasa_thermo/ -v
	@echo ""
	@echo "✅ NASA thermo tests completed."

nasa-test-all: ## Run all NASA thermo tests with coverage report
	@echo "🧪 Running NASA thermo parser tests with coverage..."
	@docker-compose run --rm python python -m pytest /app/tests/nasa_thermo/ \
		-v --tb=short \
		--cov=nasa_thermo \
		--cov-report=term-missing

