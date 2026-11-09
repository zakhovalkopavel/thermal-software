# Yaws Chemical Properties Handbook (1999) DjVu → one JSON per table
# Source: shared/sources/compound-data/Chemical properties handbook (Yaws 1999).djvu
# Output: shared/processed/yaws1999/table-*.json + index.json
# Working dumps: tmp/reports/python/yaws1999/ (container: reports/yaws1999/)
# Spec: docs/scripts/YAWS1999_PARSER_SPEC.md
# Implementation: python/src/yaws1999/ (full-page Surya OCR)

.PHONY: yaws1999-parse yaws1999-test

yaws1999-parse: ## Parse Yaws 1999 DjVu (Surya) [TABLE=] [QUANT=bf16|q8] [DPI=400] [FORCE=1] [NO_REPLACE=1]
	@docker compose run --rm python python src/scripts/parse_yaws1999.py \
		$(if $(TABLE),$(foreach t,$(TABLE),--table $(t))) \
		$(if $(QUANT),--quant $(QUANT)) \
		$(if $(DPI),--dpi $(DPI)) \
		$(if $(FIRST),--first $(FIRST)) \
		$(if $(LAST),--last $(LAST)) \
		$(if $(FORCE),--force) \
		$(if $(NO_REPLACE),--no-replace)

yaws1999-test: ## Run Yaws 1999 parser unit tests
	@echo "Running Yaws 1999 parser tests…"
	@docker compose run --rm python python -m pytest /app/tests/yaws1999/ -q
