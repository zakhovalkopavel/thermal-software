# Metal-data synthesizer — ASM / Abu-Eishah raw tables → per-alloy JSON
# Source:  shared/sources/metal-data/raw-tables/
# Output:  shared/processed/metal-data/
# Report:  tmp/reports/python/metal-data/
# Spec:    docs/scripts/METAL_DATA_SPEC.md

METAL_DATA_RAW := shared/sources/metal-data/raw-tables
METAL_DATA_OUT := shared/processed/metal-data
METAL_DATA_TESTS := /app/tests/metal_data/

ASM_CHEM_PDF := shared/sources/steel/ASM Handbook - Irons, Steels, and High Performance Alloys, Vol 01_chem_composition.pdf
ASM_CHEM_REPORT := tmp/reports/python/metal-data/asm-chem-composition

.PHONY: metal-data-build metal-data-test metal-data-asm-chem-inventory metal-data-asm-chem-surya metal-data-asm-chem-parse

metal-data-build: ## Synthesize per-alloy metal dataset from raw tables → shared/processed/metal-data/
	@echo "🧪 Building metal-data alloys…"
	@docker compose run --rm python python src/scripts/build_metal_data.py \
		--raw-dir $(METAL_DATA_RAW) \
		--out-dir $(METAL_DATA_OUT)
	@echo "✅ Done → $(METAL_DATA_OUT)/ (report: tmp/reports/python/metal-data/)"

metal-data-test: ## Run metal_data unit tests (in python container)
	@echo "🧪 Running metal_data tests…"
	@docker compose run --rm python python -m pytest $(METAL_DATA_TESTS) -v

metal-data-asm-chem-inventory: ## Tesseract inventory of ASM chem-composition PDF vs raw-tables
	@echo "🧪 ASM chem-composition inventory (tesseract)…"
	@docker compose run --rm python python src/scripts/asm_chem_composition_inventory.py \
		--pdf "/app/$(ASM_CHEM_PDF)" \
		--report-dir /app/reports/metal-data/asm-chem-composition
	@echo "✅ → $(ASM_CHEM_REPORT)/table-inventory.json"

metal-data-asm-chem-surya: ## Surya OCR (page-ocr) of selected gap pages from gap-page-selections.json
	@echo "🧪 ASM chem-composition Surya OCR (PAGE_OCR_BACKEND)…"
	@docker compose run --rm python python src/scripts/asm_chem_composition_surya.py \
		--pdf "/app/$(ASM_CHEM_PDF)" \
		--report-dir /app/reports/metal-data/asm-chem-composition
	@echo "✅ → $(ASM_CHEM_REPORT)/surya/"

metal-data-asm-chem-parse: ## Parse Surya dumps → new raw-tables composition JSON + coverage report
	@echo "🧪 Parse ASM chem-composition gap tables…"
	@docker compose run --rm python python src/scripts/asm_chem_composition_parse.py \
		--report-dir /app/reports/metal-data/asm-chem-composition \
		--raw-dir $(METAL_DATA_RAW) \
		--alloys-index $(METAL_DATA_OUT)/index.json
	@echo "✅ raw-tables updated; report → tmp/reports/python/metal-data/composition-gap-fill.json"
