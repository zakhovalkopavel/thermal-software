# Temporary Files and Reports (`tmp/`)

## Rule

`tmp/` is local scratch space. **ALL generated reports, logs and output files MUST be saved under `tmp/`**
(reports in `tmp/reports/`), and **nothing in `tmp/` is committed** except `.gitkeep` and `.gitignore` files.

The root `.gitignore` enforces this:

```gitignore
tmp/**
!tmp/**/
!tmp/**/.gitkeep
!tmp/**/.gitignore
```

`scripts/verify-migration-setup.sh` fails if any other file under `tmp/` is tracked.

## What Goes Where

A file belongs in `tmp/` only if it can be deleted at any time without breaking anything. If code, a make target,
a test or a doc depends on it, it belongs somewhere else:

| Content                                                       | Location                                     |
|---------------------------------------------------------------|----------------------------------------------|
| Generated output: logs, test/benchmark results, renders, overlays, review lists | `tmp/reports/<area>/`      |
| One-off scratch scripts, experiments, personal notes          | `tmp/` (any folder outside `tmp/reports/`)   |
| Code used by the application, make targets or tests           | `backend/src/`, `python/src/`, `scripts/`    |
| Specs, decisions, documentation                               | `docs/`                                      |
| Source documents (PDFs, books, papers)                        | `shared/sources/`                            |
| Curated data extracted from sources                           | `shared/processed/`                          |

Docs may name a `tmp/` folder as an output location, but must not link to a specific file in `tmp/`: on a fresh
clone that file does not exist.

When a scratch file turns out to be needed, **move** it (do not copy) to its proper location and commit it there.

## Directory Structure

```
tmp/
├── reports/
│   ├── builds/            # .gitkeep tracked
│   ├── calculations/      # .gitkeep tracked
│   ├── migrations/        # .gitkeep tracked
│   ├── performance/       # .gitkeep tracked
│   ├── tests/             # .gitkeep tracked
│   └── python/            # .gitkeep tracked; mounted as /app/reports in the python container (compose.yml)
│       └── phase-diagrams/   # working files of the phase-diagram extraction
└── <anything else>/       # local scratch, never tracked
```

A folder that must exist on a fresh clone gets a `.gitkeep` (a plain `git add` works, the ignore rules allow it).
A `tmp/<folder>/.gitignore` may hold extra local rules but cannot un-ignore other files.

## Naming

- One subfolder per tool or area: `tmp/reports/<area>/`.
- Timestamped filenames for repeated runs: `<topic>-YYYYMMDD-HHMMSS.<ext>`.

```bash
npm run benchmark > tmp/reports/performance/benchmark-$(date +%Y%m%d-%H%M%S).json
npm test -- --json --outputFile=tmp/reports/tests/test-results-$(date +%Y%m%d).json
npm run typeorm migration:run > tmp/reports/migrations/migration-$(date +%Y%m%d).log 2>&1
```

## Cleanup

```bash
# Remove all generated reports, keep the folder skeleton
find tmp/reports -type f ! -name '.gitkeep' ! -name '.gitignore' -delete

# Remove reports older than 30 days
find tmp/reports -type f ! -name '.gitkeep' ! -name '.gitignore' -mtime +30 -delete
```

## CI/CD

Upload reports as build artifacts instead of committing them:

```yaml
- name: Upload test reports
  uses: actions/upload-artifact@v4
  with:
    name: test-reports
    path: tmp/reports/tests/
    retention-days: 30
```

---

**Created:** Feb 1, 2026
**Last Updated:** Oct 6, 2026
