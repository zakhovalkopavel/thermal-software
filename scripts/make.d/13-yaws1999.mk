# Yaws Chemical Properties Handbook (1999) DjVu → one JSON per table
# Source: shared/sources/compound-data/Chemical properties handbook (Yaws 1999).djvu
# Dataset: shared/processed/yaws1999/<Slug>_(table_<id>).json + index.json
# Dumps/debug: tmp/reports/python/yaws1999/pages/, …/debug/
# Spec: docs/scripts/YAWS1999_PARSER_SPEC.md

.PHONY: yaws1999-parse yaws1999-rebuild yaws1999-test

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

yaws1999-test: ## Run Yaws 1999 parser unit tests
	@echo "Running Yaws 1999 parser tests…"
	@docker compose run --rm python python -m pytest /app/tests/yaws1999/ -q
