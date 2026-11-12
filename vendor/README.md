# vendor/ — git submodules

Two libraries, each a **separate git repository**, registered as submodules:

| Directory | Remote | Role |
| --- | --- | --- |
| `page-ocr/` | `git@github.com:zakhovalkopavel/page-ocr.git` | Page OCR (local + Modal) |
| `source-extract/` | `git@github.com:zakhovalkopavel/source-extract.git` | Tables + diagrams CV + papers |

```bash
git clone <thermal-software> && cd thermal-software
make setup               # init-submodules + .env + sync-vendor-env
# later:
make init-submodules     # checkout pinned SHAs (same as setup’s first step)
make update-submodules   # fetch latest remote tips for vendor/*
make sync-vendor-env
```

Host adapters (`python/src/yaws1999`, `python/src/phase_diagrams`) keep book-specific catalogs, schemas, and cross-checks. Compose mounts both vendor trees onto `PYTHONPATH`.

Plan: [docs/SHARED_LIBRARIES_SUBMODULES.md](../docs/SHARED_LIBRARIES_SUBMODULES.md).
