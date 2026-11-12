# Yaws OCR on Modal (via page-ocr)

Deploy the shared **page-ocr** Modal app, then set ``PAGE_OCR_BACKEND=modal``.

```bash
# .env must use page-ocr names (not the retired yaws-surya-ocr / SuryaOcr):
#   PAGE_OCR_MODAL_APP=page-ocr
#   PAGE_OCR_MODAL_CLASS=PageOcr
make sync-vendor-env
make page-ocr-deploy
# alias: make yaws1999-modal-deploy
```

One deploy covers **both** `bf16` and `q8`. The client selects the worker with `PAGE_OCR_QUANT` (no redeploy to switch). Each quant keeps its own warm Modal container.

Smoke one page against Modal before a full parse:

```bash
make yaws1999-ocr-smoke BACKEND=modal
PAGE_OCR_BACKEND=modal PAGE_OCR_QUANT=q8 make yaws1999-parse PAGE=37 FORCE=1 NO_REPLACE=1
PAGE_OCR_BACKEND=modal PAGE_OCR_QUANT=bf16 make yaws1999-parse PAGE=37 FORCE=1 NO_REPLACE=1
```

Use ``PAGE_OCR_*`` / ``MODAL_TOKEN_*`` from ``.env`` / ``vendor/page-ocr/.env.example``.
Legacy ``YAWS_*`` and ``yaws-surya-ocr`` / ``SuryaOcr`` names are retired.

See also: `vendor/page-ocr/README.md`, `docs/scripts/YAWS1999_PARSER_SPEC.md`.
