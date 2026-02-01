# Python Container - Docker Setup
Run scripts inside Docker → No Python installation on host required.

**Python container is ready!**

---

   - Save results to `tmp/reports/python/`
   - Run with pytest inside container
   - Write tests in `python_scripts/tests/`
4. **Test Your Scripts**

   - ✅ Use `os.getenv('DB_HOST')`
   - ❌ Hardcode database credentials
3. **Use Environment Variables**

   - ✅ Save to `tmp/reports/python/`
   - ❌ Save to random locations
2. **All Outputs to Reports**

   - ✅ `docker-compose exec python python3 /app/python_scripts/script.py`
   - ❌ `python script.py` on host
1. **NO Python on Host**

## Rules for Python Development

---

```
"
conn.close()
print('✅ Connected!')
)
    dbname=os.getenv('DB_DATABASE')
    password=os.getenv('DB_PASSWORD'),
    user=os.getenv('DB_USERNAME'),
    host=os.getenv('DB_HOST'),
conn = psycopg2.connect(
import os
import psycopg2
docker-compose exec python python3 -c "
# Test connection

docker-compose ps postgres
# Check database is healthy
```bash
### Can't connect to database

```
docker-compose exec python pip3 install <package>
# Then install Python package

docker-compose exec python apk add --no-cache gcc musl-dev linux-headers
# Install build dependencies
```bash
### Package installation fails

```
docker-compose restart python
# Restart

docker-compose ps python
# Check status

docker-compose logs python
# Check logs
```bash
### Python container not starting

## Troubleshooting

---

- Consistent with project structure
- Automatically gitignored
- All outputs go to `tmp/reports/python/`
✅ **Reports Management**

- Same network as backend/database
- Can connect to PostgreSQL directly
✅ **Access to Database**

- Clean separation from host system
- Packages in Docker volume
✅ **Isolated Environment**

- No pip install conflicts
- No virtual environment needed on host
- Consistent Python version across team
✅ **No Python on Host**

## Advantages of Docker Python

---

```
  > tmp/reports/python/pytest-results-$(date +%Y%m%d).txt
docker-compose exec python pytest /app/python_scripts/tests/ \
```bash
### Save Test Results

```
exit

python3 /app/python_scripts/test_processor.py
# Or run individual test

pytest /app/python_scripts/tests/
pip3 install pytest
# Run with pytest (if installed)

docker-compose exec python sh
```bash
### Inside Container

## Testing Python Scripts

---

```
  > tmp/reports/python/pubchem-fetch-$(date +%Y%m%d).log
docker-compose exec python python3 /app/python_scripts/bulk_pubchem_fetcher.py \
# Bulk fetch from PubChem
```bash
### Fetch External Data

```
  > tmp/reports/python/enrichment-$(date +%Y%m%d).log
docker-compose exec python python3 /app/python_scripts/enrich_database.py \
# Enrich database with PubChem data
```bash
### Database Enrichment

```
  > tmp/reports/python/data-processing-$(date +%Y%m%d).log
docker-compose exec python python3 /app/python_scripts/thermophysical_data_processor.py \
# Process thermophysical data
```bash
### Data Processing

## Common Tasks

---

```
└── *.log                    (script outputs - gitignored)
├── .gitkeep
tmp/reports/python/          (mounted at /app/reports)

└── README.md
├── requirements.txt         (create this for dependencies)
├── enrich_database.py
├── bulk_pubchem_fetcher.py
├── thermophysical_data_processor.py
python_scripts/               (mounted at /app/python_scripts)
```

## Directory Structure

---

```
)
    dbname=os.getenv('DB_DATABASE', 'refractory')
    password=os.getenv('DB_PASSWORD'),
    user=os.getenv('DB_USERNAME', 'thermal-soft'),
    port=os.getenv('DB_PORT', '5432'),
    host=os.getenv('DB_HOST', 'postgres'),
conn = psycopg2.connect(

import psycopg2
import os
```python
Use in Python:

```
DB_DATABASE=thermal
DB_PASSWORD=<from .env>
DB_USERNAME=thermal
DB_PORT=5432
DB_HOST=postgres
```bash
The Python container has access to database credentials:

## Environment Variables

---

**Note:** Installed packages persist in `python_packages` volume.

```
exit
# Exit

pip3 install -r requirements.txt
# Install from requirements

EOF
psycopg2-binary==2.9.9
requests==2.31.0
scipy==1.12.0
numpy==1.26.3
pandas==2.2.0
cat > requirements.txt << 'EOF'
# Or create requirements.txt

pip3 install pandas numpy scipy
# Install packages

docker-compose exec python sh
# Access container
```bash
### Install Python Packages

```
docker-compose exec python python3 /app/python_scripts/bulk_pubchem_fetcher.py > tmp/reports/python/pubchem-$(date +%Y%m%d).log
# Run with output to reports

docker-compose exec python python3 /app/python_scripts/thermophysical_data_processor.py
# Run directly (NO python on host!)
```bash
### Run Python Scripts

```
pip3 --version
python3 --version  # 3.14.2
# Inside container

docker-compose exec python sh
# Access shell
```bash
### Access Python Container

## Usage

---

```
python_packages      → /usr/local/lib/...   (Installed packages)
./tmp/reports/python → /app/reports         (Output reports)
./legacy/library     → /app/library         (Data library)
./python_scripts     → /app/python_scripts  (Python scripts)
```
### Volumes Mounted

- **Command:** `tail -f /dev/null` (keeps container running)
- **Working Directory:** `/app`
- **Image:** `python:3.14.2-alpine`
- **Container Name:** `thermal-python`
### Service Details

## Python Container Configuration

---

**Purpose:** Run Python scripts inside Docker (NO Python on host)
**Version:** 3.14.2-alpine (verified: February 1, 2026)  


