# Reports Directory

**IMPORTANT: ALL temporary reports, logs, and output files MUST be saved in this directory.**

This directory is used for storing temporary report files generated during development, testing, and operations.

## Purpose

- Store calculation reports
- Store performance benchmarks
- Store test results
- Store migration reports
- Store setup/configuration reports
- Store any temporary output files

## Important Rules

✅ **DO:**
- Save all reports to appropriate subdirectories
- Use descriptive filenames with timestamps
- Clean up old reports regularly (>30 days)

❌ **DON'T:**
- Save reports in project root
- Commit report files to git (they're gitignored)
- Save sensitive data without encryption

## Directory Structure

The directory structure is tracked in git, but actual report files are gitignored.

## Structure

```
tmp/reports/
├── calculations/       # Calculation results
├── migrations/         # Migration reports
├── performance/        # Performance benchmarks
└── tests/             # Test reports
```

## Usage

```bash
# Example: Save a calculation report
echo "Report content" > tmp/reports/calculations/report-$(date +%Y%m%d-%H%M%S).txt

# Example: Save migration log
npm run migrate > tmp/reports/migrations/migration-$(date +%Y%m%d).log
```

## Cleanup

Report files older than 30 days should be cleaned up:

```bash
find tmp/reports -type f -mtime +30 -delete
```

---

**Note:** Report files (*.log, *.txt, *.json, etc.) in this directory are gitignored.

