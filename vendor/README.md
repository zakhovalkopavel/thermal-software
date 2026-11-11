# vendor/ — git submodules

Two libraries, each a **separate git repository**:

| Directory | Role |
| --- | --- |
| `page-ocr/` | Page OCR (local + Modal); PDF / DjVu / image → grey page |
| `source-extract/` | Generic source → result (tables + diagrams CV + papers) |

Host adapters (`python/src/yaws1999`, `python/src/phase_diagrams`) keep book-specific catalogs, schemas, and cross-checks. Compose mounts both vendor trees onto `PYTHONPATH`.

Plan: [docs/SHARED_LIBRARIES_SUBMODULES.md](../docs/SHARED_LIBRARIES_SUBMODULES.md).
