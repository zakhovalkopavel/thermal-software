# Reports Management

## Overview

The `tmp/reports/` directory is tracked in git (directory structure only), but actual report files are gitignored.

## Directory Structure

```
tmp/reports/
├── README.md                   # ✅ Tracked in git
├── calculations/               # ✅ Directory tracked
│   ├── .gitkeep                # ✅ Tracked in git
│   └── *.log, *.txt, *.json    # ❌ Ignored (actual reports)
├── migrations/                 # ✅ Directory tracked
│   ├── .gitkeep                # ✅ Tracked in git
│   └── *.log, *.txt            # ❌ Ignored (actual reports)
├── performance/                # ✅ Directory tracked
│   ├── .gitkeep                # ✅ Tracked in git
│   └── *.json, *.csv           # ❌ Ignored (actual reports)
└── tests/                      # ✅ Directory tracked
    ├── .gitkeep                # ✅ Tracked in git
    └── *.xml, *.json           # ❌ Ignored (actual reports)
```

## .gitignore Configuration

```gitignore
# Ignore tmp/* but keep reports structure
tmp/*
!tmp/reports/
!tmp/reports/README.md
!tmp/reports/**/
!tmp/reports/**/.gitkeep

# Ignore all report files
tmp/reports/**/*.log
tmp/reports/**/*.txt
tmp/reports/**/*.json
tmp/reports/**/*.xml
tmp/reports/**/*.csv
tmp/reports/**/*.md
!tmp/reports/README.md  # Exception: keep main README
```

## Usage Examples

### Generate Calculation Report

```bash
# NestJS backend
npm run calculate > tmp/reports/calculations/calc-$(date +%Y%m%d-%H%M%S).log

# Or in code
import { writeFile } from 'fs/promises';

const report = {
  timestamp: new Date().toISOString(),
  results: calculationResults
};

await writeFile(
  `tmp/reports/calculations/calc-${Date.now()}.json`,
  JSON.stringify(report, null, 2)
);
```

### Generate Migration Report

```bash
# Run migration with logging
npm run typeorm migration:run > tmp/reports/migrations/migration-$(date +%Y%m%d).log 2>&1
```

### Generate Performance Report

```bash
# Benchmark results
npm run benchmark > tmp/reports/performance/benchmark-$(date +%Y%m%d).json
```

### Generate Test Report

```bash
# Jest with JSON reporter
npm test -- --json --outputFile=tmp/reports/tests/test-results.json

# Or with coverage
npm run test:cov > tmp/reports/tests/coverage-$(date +%Y%m%d).txt
```

## Cleanup

### Manual Cleanup

```bash
# Remove all reports
rm -rf tmp/reports/calculations/*
rm -rf tmp/reports/migrations/*
rm -rf tmp/reports/performance/*
rm -rf tmp/reports/tests/*

# Keep .gitkeep files
find tmp/reports -type f ! -name '.gitkeep' ! -name 'README.md' -delete
```

### Automated Cleanup (older than 30 days)

```bash
# Add to cron or npm script
find tmp/reports -type f -name "*.log" -mtime +30 -delete
find tmp/reports -type f -name "*.json" -mtime +30 -delete
find tmp/reports -type f -name "*.txt" -mtime +30 -delete
```

### Makefile Target

Add to `Makefile`:

```makefile
clean-reports:
	@echo "🧹 Cleaning old reports..."
	@find tmp/reports -type f ! -name '.gitkeep' ! -name 'README.md' -mtime +30 -delete
	@echo "✅ Old reports cleaned"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/ci.yml
- name: Run tests and generate reports
  run: |
    npm test -- --json --outputFile=tmp/reports/tests/test-results.json
    
- name: Upload test reports
  uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: tmp/reports/tests/
    retention-days: 30
```

## Benefits

✅ **Directory structure in git** - Team knows where reports go  
✅ **Actual files ignored** - No bloat in repository  
✅ **Consistent location** - All reports in one place  
✅ **Easy cleanup** - Simple scripts to manage old files  
✅ **CI/CD friendly** - Can upload as artifacts  

## Notes

- Report files are temporary and should not be committed
- Directory structure is tracked so all developers have the same layout
- `.gitkeep` files ensure empty directories are tracked
- Cleanup old reports regularly to save disk space

---

**Created:** Feb 1, 2026  
**Last Updated:** Feb 1, 2026

