# Documentation consistency checks
.PHONY: doc-check doc-links
doc-check: ## Check documentation consistency (broken links, status vs filesystem, orphans, stale dates)
	@bash scripts/check-docs.sh
doc-links: ## Quick check - broken relative links in docs/ only
	@bash scripts/check-docs.sh --links-only
