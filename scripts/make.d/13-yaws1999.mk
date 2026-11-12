# Yaws Chemical Properties Handbook (1999) → one JSON per table
# Source: shared/sources/compound-data/Chemical properties handbook (Yaws 1999).djvu
# Dataset: shared/processed/yaws1999/<Slug>_(table_<id>).json + index.json
# Dumps/debug: tmp/reports/python/yaws1999/pages/, …/debug/
# OCR: vendor/page-ocr (PAGE_OCR_*). Spec: docs/scripts/YAWS1999_PARSER_SPEC.md

.PHONY: yaws1999-parse yaws1999-rebuild yaws1999-modal-deploy page-ocr-deploy yaws1999-test

yaws1999-parse: ## OCR+parse Yaws 1999 [TABLE=] [QUANT=bf16|q8] [DPI=400] [FORCE=1] [NO_REPLACE=1]
	@docker compose run --rm python python src/scripts/parse_yaws1999.py \
		$(if $(TABLE),$(foreach t,$(TABLE),--table $(t))) \
		$(if $(QUANT),--quant $(QUANT)) \
		$(if $(DPI),--dpi $(DPI)) \
		$(if $(FIRST),--first $(FIRST)) \
		$(if $(LAST),--last $(LAST)) \
		$(if $(FORCE),--force) \
		$(if $(NO_REPLACE),--no-replace)

yaws1999-rebuild: ## Rebuild dataset JSON from page dumps (no OCR) [TABLE=]
	@docker compose run --rm python python src/scripts/rebuild_yaws1999.py \
		$(if $(TABLE),$(foreach t,$(TABLE),--table $(t))) \
		$(if $(FIRST),--first $(FIRST)) \
		$(if $(LAST),--last $(LAST))

page-ocr-deploy yaws1999-modal-deploy: sync-vendor-env ## Deploy page-ocr Modal app (PAGE_OCR_* + MODAL_TOKEN_* in .env)
	@docker compose run --rm python sh -c '\
		if [ -z "$$MODAL_TOKEN_ID" ] || [ -z "$$MODAL_TOKEN_SECRET" ]; then \
			echo "Set MODAL_TOKEN_ID and MODAL_TOKEN_SECRET in .env (https://modal.com/settings), then retry." >&2; \
			exit 1; \
		fi; \
		python -c "import modal; assert modal.__version__.split(\".\")[0] >= \"1\"" 2>/dev/null \
			|| pip install --no-cache-dir "modal>=1.6,<2"; \
		cd /app/vendor/page-ocr && python -m page_ocr deploy'

yaws1999-test: ## Run Yaws 1999 parser unit tests
	@echo "Running Yaws 1999 parser tests…"
	@docker compose run --rm python python -m pytest /app/tests/yaws1999/ -q
