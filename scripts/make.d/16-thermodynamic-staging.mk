# Thermochemical staging from free Tier-1/2 sources (Abdul TDB, hp633, paper tables)
# Sources: shared/sources/minerals-thermodynamic/
# Output:  shared/processed/minerals-thermodynamic/
# Spec:    docs/scripts/THERMOCHEMICAL_STAGING_SPEC.md

.PHONY: thermodynamic-staging-extract thermodynamic-staging-test \
	thermodynamic-staging-ocr-list thermodynamic-staging-ocr-job \
	thermodynamic-staging-ocr-melt thermodynamic-staging-ocr-mao-papers \
	thermodynamic-staging-ocr-jung thermodynamic-staging-ocr-pankratz \
	thermodynamic-staging-ocr-mao \
	thermodynamic-staging-ocr-yazhenskikh thermodynamic-staging-ocr-malan \
	thermodynamic-staging-ocr-abdul-ccr thermodynamic-staging-ocr-koroleva

PANK_PDF := shared/sources/minerals-thermodynamic/USBM Bulletin 672 Thermodynamic properties of elements and oxides (Pankratz 1982).pdf
MAO_PDF := shared/sources/minerals-thermodynamic/Huahai Mao (2005), KTH Doctoral Thesis.pdf

thermodynamic-staging-extract: ## Extract compact phases.json for every staging source
	@echo "🧪 Thermochemical staging extraction…"
	@docker compose run --rm python python src/scripts/extract_thermodynamic_staging.py
	@echo "✅ → shared/processed/minerals-thermodynamic/"

thermodynamic-staging-test: ## Unit tests for thermochemical staging parsers
	@docker compose run --rm python python -m pytest /app/tests/thermodynamic_staging/ -q

# --- Catalogued OCR (skip existing page-NNNN.txt unless FORCE=1) ---
# After USGS 2131 finishes: make thermodynamic-staging-ocr-melt BACKEND=modal
thermodynamic-staging-ocr-list: ## List melt/Yazhenskikh/Jung/Malan OCR jobs + Mao Papers I–V PDFs
	@docker compose run --rm python python src/scripts/thermodynamic_staging_ocr_run.py --list

thermodynamic-staging-ocr-job: ## OCR one catalog job [JOB=yazhenskikh-2007] [BACKEND=modal] [PAGE=] [FORCE=1]
	@test -n "$(JOB)" || (echo "Usage: make thermodynamic-staging-ocr-job JOB=<id> BACKEND=modal"; exit 1)
	@echo "🧪 Staging OCR job=$(JOB) (PAGE_OCR_BACKEND=$(or $(BACKEND),from .env))…"
	@docker compose run --rm \
		$(if $(BACKEND),-e PAGE_OCR_BACKEND=$(BACKEND)) \
		python python src/scripts/thermodynamic_staging_ocr_run.py \
		--job $(JOB) \
		$(if $(PAGE),$(foreach p,$(PAGE),--page $(p))) \
		$(if $(QUANT),--quant $(QUANT)) \
		$(if $(DPI),--dpi $(DPI)) \
		$(if $(FORCE),--force)
	@echo "✅ → tmp/reports/python/minerals-thermodynamic/$(JOB)/ocr/"

# Melt-model papers needing (re)OCR: Yazhenskikh 07/08/09 + full Jung + Malan.
thermodynamic-staging-ocr-melt: ## OCR Yazhenskikh×3 + Jung + Malan [BACKEND=modal] [FORCE=1]
	@echo "🧪 Staging melt OCR batch (PAGE_OCR_BACKEND=$(or $(BACKEND),from .env))…"
	@docker compose run --rm \
		$(if $(BACKEND),-e PAGE_OCR_BACKEND=$(BACKEND)) \
		python python src/scripts/thermodynamic_staging_ocr_run.py \
		--batch melt \
		$(if $(QUANT),--quant $(QUANT)) \
		$(if $(DPI),--dpi $(DPI)) \
		$(if $(FORCE),--force)
	@echo "✅ → tmp/reports/python/minerals-thermodynamic/{yazhenskikh-*,jung-2009,malan-2019}/ocr/"

thermodynamic-staging-ocr-yazhenskikh: ## OCR all three Yazhenskikh workshop PDFs [BACKEND=modal]
	@$(MAKE) thermodynamic-staging-ocr-job JOB=yazhenskikh-2007 BACKEND=$(BACKEND) QUANT=$(QUANT) DPI=$(DPI) FORCE=$(FORCE)
	@$(MAKE) thermodynamic-staging-ocr-job JOB=yazhenskikh-2008 BACKEND=$(BACKEND) QUANT=$(QUANT) DPI=$(DPI) FORCE=$(FORCE)
	@$(MAKE) thermodynamic-staging-ocr-job JOB=yazhenskikh-2009 BACKEND=$(BACKEND) QUANT=$(QUANT) DPI=$(DPI) FORCE=$(FORCE)

thermodynamic-staging-ocr-malan: ## OCR Malan 2019 full paper [BACKEND=modal]
	@$(MAKE) thermodynamic-staging-ocr-job JOB=malan-2019 BACKEND=$(BACKEND) QUANT=$(QUANT) DPI=$(DPI) FORCE=$(FORCE)

thermodynamic-staging-ocr-abdul-ccr: ## OCR Abdul CCR CaO–SiO2 paper (16 pp) [BACKEND=modal]
	@$(MAKE) thermodynamic-staging-ocr-job JOB=abdul-2023-ccr BACKEND=$(BACKEND) QUANT=$(QUANT) DPI=$(DPI) FORCE=$(FORCE)

thermodynamic-staging-ocr-koroleva: ## OCR Koroleva 2017 (10 pp) Modal Surya [BACKEND=modal]
	@$(MAKE) thermodynamic-staging-ocr-job JOB=koroleva-2017 BACKEND=$(BACKEND) QUANT=$(QUANT) DPI=$(DPI) FORCE=$(FORCE)

# Drop Mao Papers I–V journal PDFs into shared/sources/minerals-thermodynamic/mao-papers/
thermodynamic-staging-ocr-mao-papers: ## OCR every PDF in mao-papers/ [BACKEND=modal]
	@echo "🧪 Mao Papers I–V OCR (PAGE_OCR_BACKEND=$(or $(BACKEND),from .env))…"
	@docker compose run --rm \
		$(if $(BACKEND),-e PAGE_OCR_BACKEND=$(BACKEND)) \
		python python src/scripts/thermodynamic_staging_ocr_run.py \
		--mao-papers \
		$(if $(QUANT),--quant $(QUANT)) \
		$(if $(DPI),--dpi $(DPI)) \
		$(if $(FORCE),--force)
	@echo "✅ → tmp/reports/python/minerals-thermodynamic/mao-papers/"

# BACKEND=modal|local — Modal Surya for table pages (legacy thin wrappers)
thermodynamic-staging-ocr-jung: ## OCR full Jung 2009 paper (skips existing dumps) [BACKEND=modal]
	@$(MAKE) thermodynamic-staging-ocr-job JOB=jung-2009 BACKEND=$(BACKEND) QUANT=$(QUANT) DPI=$(DPI) FORCE=$(FORCE) PAGE="$(PAGE)"

thermodynamic-staging-ocr-pankratz: ## OCR Pankratz 672 priority oxide pages [BACKEND=modal]
	@echo "🧪 Pankratz 672 OCR (PAGE_OCR_BACKEND=$(or $(BACKEND),from .env))…"
	@docker compose run --rm \
		$(if $(BACKEND),-e PAGE_OCR_BACKEND=$(BACKEND)) \
		python python src/scripts/thermodynamic_staging_ocr.py \
		--pdf "/app/$(PANK_PDF)" \
		--report-dir /app/reports/minerals-thermodynamic/pankratz-1982 \
		--source-id pankratz-1982 \
		--ref Pankratz1982 \
		--page 111 --page 112 --page 220 \
		--page 238 --page 239 --page 240 --page 241 --page 242 \
		--page 481 \
		--dpi $(or $(DPI),250) \
		$(if $(FORCE),--force)
	@echo "✅ → tmp/reports/python/minerals-thermodynamic/pankratz-1982/ocr/"

thermodynamic-staging-ocr-mao: ## OCR Mao 2005 thesis pages [BACKEND=modal] [PAGE="11 13 …"]
	@echo "🧪 Mao 2005 OCR (PAGE_OCR_BACKEND=$(or $(BACKEND),from .env))…"
	@docker compose run --rm \
		$(if $(BACKEND),-e PAGE_OCR_BACKEND=$(BACKEND)) \
		python python src/scripts/thermodynamic_staging_ocr.py \
		--pdf "/app/$(MAO_PDF)" \
		--report-dir /app/reports/minerals-thermodynamic/mao-2005 \
		--source-id mao-2005 \
		--ref Mao2005 \
		$(if $(PAGE),$(foreach p,$(PAGE),--page $(p)),--page 1 --page 2 --page 3) \
		$(if $(DPI),--dpi $(DPI)) \
		$(if $(FORCE),--force)
	@echo "✅ → tmp/reports/python/minerals-thermodynamic/mao-2005/ocr/"
