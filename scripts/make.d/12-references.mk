# Literature references (RefKey) — one source for backend, python and docs
# Source file: shared/references/references.json
# Generated: backend/src/common/thermal/enum/ref-key.enum.ts, backend/src/common/thermal/dto/ref-key.dto.ts,
#            python/src/references/ref_key.py, python/src/references/references_meta.py,
#            the table in docs/REFERENCES.md
# Generator: scripts/generate_references.py (standard library only)

REFERENCES_RUN := docker-compose run --rm --no-deps --user "$$(id -u):$$(id -g)" -v "$(CURDIR):/repo" -w /repo python \
	python scripts/generate_references.py --root /repo

.PHONY: references-generate references-check

references-generate: ## Regenerate RefKey (backend + python) and the docs/REFERENCES.md table from shared/references/references.json
	@echo "📚 Generating references..."
	@$(REFERENCES_RUN)

references-check: ## Fail when a generated reference file differs from shared/references/references.json
	@$(REFERENCES_RUN) --check
