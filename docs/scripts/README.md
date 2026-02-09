# Python Scripts Documentation

This directory contains documentation for Python scripts available in the thermal-software Python container.

## Available Scripts

### OCR Table Extraction

Extract tables from PDF and image files using OCR and direct extraction methods.

📄 **[OCR_TABLE_EXTRACTION.md](OCR_TABLE_EXTRACTION.md)** - Complete guide for table extraction

**Quick Start:**
```bash
make ocr-test     # Generate test data
make ocr-extract  # Run extraction (interactive)
```

## Python Container

The Python container provides a complete environment for data processing, analysis, and utilities related to thermal engineering calculations.

### Features

- **OCR & Table Extraction**: Extract data from PDFs and images
- **Data Processing**: Thermophysical property calculations
- **Database Integration**: PostgreSQL connectivity for data storage
- **Scientific Computing**: NumPy, SciPy, Pandas for analysis

### Container Access

```bash
# Enter Python container shell
make python-bash

# Run a script directly
docker exec -it thermal-python python /app/src/scripts/your_script.py

# View logs
docker logs thermal-python
```

### Directory Structure

```
python/
├── src/
│   ├── ocr/             # OCR table extraction package
│   └── scripts/         # Production scripts
├── tests/               # Test files
└── pyproject.toml       # Python dependencies (Poetry)

shared/
├── sources/             # Input files
└── processed/           # Output files and logs
```

## Adding New Scripts

When adding new Python scripts to the container:

1. Place script in `python/scripts/`
2. Add dependencies to `python/pyproject.toml` if needed
3. Document in `docs/scripts/`
4. Add Makefile command if appropriate
5. Test in container before committing

### Example: Adding a New Script

```bash
# 1. Create script
cat > python/scripts/my_analysis.py << 'EOF'
#!/usr/bin/env python3
"""My analysis script"""
import pandas as pd

def main():
    print("Running analysis...")
    # Your code here

if __name__ == "__main__":
    main()
EOF

# 2. Make executable
chmod +x python/scripts/my_analysis.py

# 3. Test in container
docker exec -it thermal-python python /app/scripts/my_analysis.py

# 4. Add Makefile target (optional)
# Add to Makefile:
# my-analysis:
#     docker-compose exec python python /app/scripts/my_analysis.py
```

## Dependencies

Python dependencies are managed using Poetry. See `python/pyproject.toml` for the current dependency list.

### Installing New Dependencies

```bash
# Enter container
make ocr-shell

# Add a package
cd /app/python
poetry add package-name

# Or edit pyproject.toml and run:
poetry install
```

## Documentation Standards

When documenting scripts:

- ✅ Include purpose and overview
- ✅ Provide quick start examples
- ✅ List all command-line options
- ✅ Show example usage
- ✅ Document input/output formats
- ✅ Include troubleshooting section
- ✅ Keep documentation in `docs/scripts/`

## Related Documentation

- [Python Container Setup](../PYTHON_CONTAINER.md)
- [OCR Table Extraction](OCR_TABLE_EXTRACTION.md)
- [Service Test Checklist](../SERVICE_TEST_CHECKLIST.md)

## Support

For issues with Python scripts:

1. Check container logs: `docker logs thermal-python`
2. Verify dependencies: `docker exec thermal-python pip list`
3. Check script logs in `shared/processed/`
4. Restart container: `make restart`
5. Rebuild if needed: `docker-compose build python`

