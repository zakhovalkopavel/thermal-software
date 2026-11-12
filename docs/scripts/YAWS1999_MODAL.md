# Yaws OCR on Modal (via page-ocr)

Deploy the shared **page-ocr** Modal app, then set ``PAGE_OCR_BACKEND=modal``.

```bash
make page-ocr-deploy
# alias: make yaws1999-modal-deploy
```

Use ``PAGE_OCR_*`` / ``MODAL_TOKEN_*`` from ``.env`` / ``vendor/page-ocr/.env.example``.
Legacy ``YAWS_*`` Modal env names are retired.


See also: `vendor/page-ocr/README.md`, `docs/scripts/YAWS1999_PARSER_SPEC.md`.
