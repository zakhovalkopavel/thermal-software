# Installation & Setup Guide

**Refractory Calculator Suite v1.1.0**  
**Last Updated:** January 31, 2026

---

## 🚀 Quick Start (Docker - Recommended)

**Prerequisites:** Docker and Docker Compose installed

```bash
cd /opt/thermal-software
make up
```

**That's it!** TypeScript compilation happens automatically when the container builds.

Access the application at: **http://localhost:18080**

---

## How It Works

### Automatic Build Process

1. **Docker builds the thermal-app container**
   - Runs `npm install` to install dependencies
   - Runs `npm run build` to compile TypeScript → JavaScript
   - Compiled files are stored in a shared Docker volume

2. **Nginx container mounts the shared volume**
   - Serves `public/` (HTML, CSS, client JS)
   - Serves `dist/` (compiled TypeScript) from shared volume
   - Browser can load JavaScript modules

3. **No manual build steps required!**
   - Everything happens inside containers
   - TypeScript source (`src/`) is never exposed to the browser
   - Only compiled JavaScript (`dist/`) is served

### Volume Architecture

```
thermal-app container:
  - Compiles TypeScript: src/ → dist/
  - Writes to: refractory-dist volume

refractory-calculator (Nginx) container:
  - Reads from: refractory-dist volume (read-only)
  - Serves: public/ + dist/ to browser
```

---

## 📋 Prerequisites

### Required
- **Docker** >= 20.10.0
- **Docker Compose** >= 1.29.0
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### Optional
- **Make** (for convenience commands)
- **Node.js** 24+ (for local development without Docker)

---

## 🚀 Quick Start (Recommended)

### 1. Get the Project

```bash
cd /opt/thermal-software/refractory
```

### 2. Start Services

```bash
make up
```

This command will:
- Build Docker images (first time only, ~1-2 minutes)
- Compile TypeScript to JavaScript
- Start Nginx web server
- Start Node.js API server

**Expected output:**
```
✅ Services started!
📊 Web Interface: http://localhost:18080/
⚙️  API Server: http://localhost:3010
```

### 3. Access the Application

**Open your browser:**
```
http://localhost:18080/
```

**You should see:**
- Professional homepage with module cards
- Navigation menu at the top
- Links to Phase Calculator and Blend Optimizer

---

## 📱 Using the Application

### Homepage
```
http://localhost:18080/
```
- Overview of available modules
- Feature descriptions
- Quick navigation

### Phase Equilibrium Calculator
```
http://localhost:18080/phase-calculator.html
```
- Add refractory components
- Set target temperature
- Calculate phase distribution and properties

### Blend Optimizer
```
http://localhost:18080/blend-optimizer.html
```
- Design particle size distributions
- Optimize packing and shrinkage
- Save/load custom mixes
- Export/import configurations

### About Page
```
http://localhost:18080/about.html
```
- Project information
- Technical approach
- Documentation links

---

## 🛠️ Development Workflow

### Build TypeScript

```bash
make build
```

Compiles TypeScript source files from `src/` to JavaScript in `dist/`.

### Run Tests

```bash
make test
```

Executes the test suite to verify calculations.

### View Logs

```bash
make logs
```

Shows real-time logs from all containers. Press Ctrl+C to exit.

### Restart Services

```bash
make restart
```

Stops and starts all services (useful after code changes).

### Stop Services

```bash
make down
```

Stops all containers and frees up ports.

### Development Watch Mode

```bash
make dev
```

Watches for file changes and automatically recompiles (press Ctrl+C to stop).

---

## 🐳 Docker Details

### Container Structure

The application runs in Docker with the following containers:

**thermal-app:**
- Node.js 24 Alpine
- TypeScript compilation
- API server on port 3010
- Source code in `/app`

**thermal-nginx:**
- Nginx Alpine
- Serves static files (HTML, CSS, JS)
- Proxies API requests
- Exposed on port 18080

### Port Mapping

- **18080** → Web interface (Nginx)
- **3010** → API server (Node.js, internal)

### Volumes

- `./src` → `/app/src` (source code)
- `./dist` → `/app/dist` (compiled output)
- `./public` → `/usr/share/nginx/html` (static files)

---

## 💻 Local Development (Without Docker)

If you prefer to run locally without Docker:

### Prerequisites

Install Node.js 24+ from https://nodejs.org/

### Setup

```bash
cd /opt/thermal-software/refractory

# Install dependencies (if any)
npm install

# Build TypeScript
npm run build

# Start API server (optional)
node server.js
```

### Access Locally

Since there's no Nginx, open files directly:

```bash
# Open in browser (example for Linux)
xdg-open public/index.html

# Or for macOS
open public/index.html
```

**Note:** Some features may require the API server running.

---

## ✅ Verification

### Check Services are Running

```bash
docker ps
```

You should see two containers:
- `thermal-app` (Node.js)
- `thermal-nginx` (Nginx)

### Test Web Interface

Open browser to: `http://localhost:18080/`

**Expected result:**
- Homepage loads successfully
- Navigation menu visible
- Module cards displayed
- No JavaScript errors in browser console (F12)

### Test Phase Calculator

1. Navigate to Phase Calculator
2. Select "Chamotte (Standard)"
3. Set temperature to 1450°C
4. Click "Calculate"

**Expected result:**
- Calculation completes
- Results display (liquid %, solid %, refractoriness, etc.)
- No errors

### Test Blend Optimizer

1. Navigate to Blend Optimizer
2. Click "Add Fraction" 3 times
3. Set size ranges and materials
4. Click "Optimize Blend"

**Expected result:**
- Optimization runs
- Results show packing, shrinkage predictions
- Can save to library

---

## 🔧 Troubleshooting

### Problem: Services won't start

**Solution:**
```bash
# Check Docker is running
docker version

# Check ports aren't in use
lsof -i :18080
lsof -i :3010

# If ports are in use, stop conflicting services or change ports in compose.yaml
```

### Problem: Build fails

**Solution:**
```bash
# Clean and rebuild
make down
make clean
make up
```

### Problem: Can't access web interface

**Check these:**

1. **Services running?**
   ```bash
   docker ps
   ```

2. **Correct URL?**
   ```
   http://localhost:18080/  (not 8080, not 3010)
   ```

3. **Firewall blocking?**
   ```bash
   # Temporarily disable firewall to test
   sudo ufw disable  # Ubuntu/Debian
   ```

4. **Browser cache?**
   - Clear browser cache
   - Try incognito/private mode
   - Try different browser

### Problem: TypeScript compilation errors

**Solution:**
```bash
# Check TypeScript is installed in container
docker exec thermal-app tsc --version

# Rebuild from scratch
make down
docker-compose build --no-cache
make up
```

### Problem: Changes not reflected

**Solution:**
```bash
# Rebuild and restart
make build
make restart
```

### Problem: Out of disk space

**Solution:**
```bash
# Clean up Docker
docker system prune -a
```

---

## 📂 File Locations After Installation

### Source Code
```
/opt/thermal-software/refractory/src/
```

### Compiled JavaScript
```
/opt/thermal-software/refractory/dist/
```

### Web Files
```
/opt/thermal-software/refractory/public/
├── index.html
├── phase-calculator.html
├── blend-optimizer.html
├── css/
└── js/
```

### Documentation
```
/opt/thermal-software/refractory/docs/
```

---

## 🔄 Updating the Application

### Get Latest Changes

```bash
cd /opt/thermal-software/refractory
git pull
```

### Rebuild and Restart

```bash
make down
make up
```

This will rebuild with the latest code.

---

## 🗑️ Uninstallation

### Stop and Remove Containers

```bash
make down
```

### Remove Docker Images

```bash
docker rmi thermal-app thermal-nginx
```

### Remove Project Files

```bash
rm -rf /opt/thermal-software/refractory
```

---

## 📚 Next Steps

**After successful installation:**

1. **Try the Quick Start Test:**
   - See `QUICK_START_TEST.md`
   - Follow step-by-step tutorial

2. **Read User Guides:**
   - `BLEND_OPTIMIZER_GUIDE.md` for blend optimizer
   - `spec.md` for technical details

3. **Explore Documentation:**
   - `algorithms/` for implementation details
   - `concepts/` for conceptual understanding

4. **Test Features:**
   - Follow `UI_TESTING_GUIDE.md`
   - Verify all functionality works

---

## 💡 Tips

**Performance:**
- First startup takes longer (building images)
- Subsequent starts are fast (< 10 seconds)
- Use `make restart` for quick iteration

**Development:**
- Use `make dev` for auto-rebuild during development
- Check `make logs` if something isn't working
- Use `make shell` to access container shell

**Deployment:**
- For production, consider changing ports in `compose.yaml`
- Add SSL/TLS termination if needed
- Set proper security headers in nginx.conf

---

## 🆘 Getting Help

**If problems persist:**

1. Check logs: `make logs`
2. Review error messages carefully
3. Check GitHub issues (if applicable)
4. Consult `PROJECT_STRUCTURE.md` for architecture
5. Review `spec.md` for technical details

**Common Resources:**
- Docker documentation: https://docs.docker.com/
- TypeScript handbook: https://www.typescriptlang.org/docs/
- Nginx documentation: https://nginx.org/en/docs/

---

**Installation Complete!** 🎉

Access your application at: **http://localhost:18080/**

For usage instructions, see `QUICK_START_TEST.md` and `BLEND_OPTIMIZER_GUIDE.md`.

---

### Option 2: Node.js Installation

#### From Source

```bash
# Navigate to project directory
cd /opt/thermal-software/refractory

# No npm install needed - pure JavaScript, no dependencies

# Run examples
node examples/examples_with_dictionary.js
```

#### As NPM Package (Future)

```bash
npm install refractory-calculator

# Use in your project
const RefractoryCalculator = require('refractory-calculator');
```

---

### Option 3: Docker Container

#### Using Docker Compose

```bash
cd /opt/thermal-software

# Start all services (including refractory calculator)
docker-compose up -d

# Access web interface
open http://localhost:8080/calculator.html

# View logs
docker-compose logs -f refractory-calculator
```

#### Using Dockerfile Directly

```bash
cd /opt/thermal-software/refractory

# Build image
docker build -t refractory-calculator .

# Run container
docker run -p 8080:80 -v $(pwd):/usr/src/app refractory-calculator

# Access at http://localhost:8080
```

---

## 📁 Project Structure

After installation, your directory should look like:

```
refractory/
├── RefractoryCalculatorV2.js    # Main calculator
├── calculator.html               # Web interface
├── package.json
├── constants/                    # Configuration
├── classes/                      # Core logic
├── data/                         # Data modules
│   ├── components/
│   ├── compositions/
│   ├── fractions/
│   └── phases/
├── examples/                     # Usage examples
└── docs/                         # Documentation
```

---

## 🔧 Configuration

### Custom Constants

Create a custom configuration file:

```javascript
// custom-config.js
const RefractoryConstants = require('./constants/RefractoryConstants.js');

module.exports = {
  ...RefractoryConstants,
  participation: {
    T50_fine: 1300,     // Lower than default
    T50_medium: 1400,
    T50_coarse: 1550,
    k_steepness: 0.01
  }
};
```

Use in your code:

```javascript
const RefractoryCalculator = require('./RefractoryCalculatorV2.js');
const customConfig = require('./custom-config.js');

const calc = new RefractoryCalculator(customConfig);
```

---

## 🐳 Docker Setup

### Complete docker-compose.yaml

```yaml
version: '3.9'

services:
  refractory-calculator:
    image: node:18-alpine
    container_name: refractory-calculator
    working_dir: /usr/src/app
    volumes:
      - ./refractory:/usr/src/app
    ports:
      - "8080:80"
    command: |
      sh -c "
      apk add --no-cache lighttpd &&
      lighttpd -D -f /etc/lighttpd/lighttpd.conf
      "
    environment:
      NODE_ENV: production
    restart: unless-stopped

  # Add Node.js API server (optional)
  refractory-api:
    image: node:18-alpine
    container_name: refractory-api
    working_dir: /usr/src/app
    volumes:
      - ./refractory:/usr/src/app
    ports:
      - "3000:3000"
    command: node server.js  # If you create an API server
    environment:
      NODE_ENV: production
      PORT: 3000
    restart: unless-stopped
```

### Dockerfile (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy project files
COPY . .

# Install lighttpd for serving static files
RUN apk add --no-cache lighttpd

# Expose port
EXPOSE 80

# Start web server
CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]
```

---

## ✅ Verification

### Test Installation

```bash
cd /opt/thermal-software/refractory

# Test with Node.js
node -e "const calc = require('./RefractoryCalculatorV2.js'); console.log('✓ Calculator loaded successfully');"

# Run examples
node examples/examples_with_dictionary.js

# Expected output: Calculation results for multiple examples
```

### Browser Test

1. Open `calculator.html` in browser
2. Select "Chamotte (medium)" as Component 1
3. Select "Ciment Fondu (fine)" as Component 2
4. Set temperature to 1450°C
5. Click "Calculate"
6. Verify results appear (liquid %, refractoriness, etc.)

---

## 🔍 Troubleshooting

### Issue: "Cannot find module"

**Solution:**
```bash
# Check Node.js version
node --version  # Should be >= 12.0.0

# Verify file structure
ls -la RefractoryCalculatorV2.js
ls -la data/components/ComponentsDictionary.js

# Check paths in require() statements
```

### Issue: "Docker container not starting"

**Solution:**
```bash
# Check Docker status
docker ps -a

# View logs
docker logs refractory-calculator

# Rebuild if needed
docker-compose down
docker-compose up --build
```

### Issue: "Calculator gives unexpected results"

**Solution:**
```bash
# Verify input data format
node -e "
const Components = require('./data/components/ComponentsDictionary.js');
console.log(Components.getComponent('chamotte', 'medium'));
"

# Check constants
node -e "
const Constants = require('./constants/RefractoryConstants.js');
console.log(Constants.participation);
"
```

### Issue: "Browser calculator not loading"

**Solution:**
1. Check browser console (F12) for errors
2. Verify all JavaScript files are accessible
3. Check CORS settings if running from file://
4. Use a local web server instead:
```bash
# Python 3
python3 -m http.server 8080

# Node.js (if http-server installed)
npx http-server -p 8080

# Then open http://localhost:8080/calculator.html
```

---

## 📊 Performance Tuning

### Memory Settings (Node.js)

```bash
# For large batch calculations
node --max-old-space-size=4096 examples/batch_calculations.js
```

### Optimization Tips

1. **Reuse calculator instance:**
```javascript
const calc = new RefractoryCalculator();
// Reuse for multiple calculations
results1 = calc.calculate(components1, temp1);
results2 = calc.calculate(components2, temp2);
```

2. **Pre-load components:**
```javascript
const Components = require('./data/components/ComponentsDictionary.js');
const chamotte = Components.getComponent('chamotte', 'medium');
// Reuse chamotte object multiple times
```

3. **Disable diagnostics for production:**
```javascript
const config = {
  ...RefractoryConstants,
  verboseDiagnostics: false
};
const calc = new RefractoryCalculator(config);
```

---

## 🔐 Security Considerations

### Input Validation

The calculator validates all inputs, but for web deployment:

```javascript
// Sanitize user input
function sanitizeInput(value) {
  return parseFloat(value) || 0;
}

const temperature = sanitizeInput(userInput.temperature);
```

### CORS Configuration

For API deployment:

```javascript
// server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: 'https://your-domain.com'
}));
```

---

## 📱 Mobile/Responsive Setup

The calculator.html is responsive, but for mobile optimization:

```html
<!-- Add to <head> -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="mobile-web-app-capable" content="yes">
```

---

## 🌐 Network Deployment

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name refractory-calc.example.com;
    
    root /opt/thermal-software/refractory;
    index calculator.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    location ~ \.js$ {
        add_header Content-Type application/javascript;
    }
}
```

### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName refractory-calc.example.com
    DocumentRoot /opt/thermal-software/refractory
    
    <Directory /opt/thermal-software/refractory>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>
</VirtualHost>
```

---

## 📚 Additional Resources

- **Specification:** `spec.md`
- **API Documentation:** `docs/API.md`
- **Project Structure:** `docs/PROJECT_STRUCTURE.md`
- **Quick Reference:** `QUICK_REFERENCE.md`
- **Examples:** `examples/` directory

---

## 💬 Support

### Getting Help

1. Check documentation in `docs/` folder
2. Review examples in `examples/` folder
3. Consult `spec.md` for calculation details
4. Check `QUICK_REFERENCE.md` for formulas

### Reporting Issues

Include:
- Node.js version (`node --version`)
- Input data (components, temperature)
- Expected vs actual output
- Error messages or stack traces

---

## ✅ Post-Installation Checklist

- [ ] Node.js version >= 12.0.0
- [ ] All files present in project directory
- [ ] Examples run successfully
- [ ] Browser interface loads correctly
- [ ] Calculations produce expected results
- [ ] Docker containers start (if using Docker)
- [ ] Custom configuration works (if applicable)

---

**Installation Complete!** 🎉

Next steps:
1. Open `calculator.html` to start calculations
2. Review `docs/API.md` for programmatic usage
3. Check `examples/` for code samples
4. Read `spec.md` for calculation methodology

---

**Version:** 2.0  
**Date:** December 15, 2025  
**License:** MIT

---
## 🔒 Security Notes
### Web Accessibility
**What's accessible via http://localhost:18080:**
- ✅ `public/` - Web interface (HTML, CSS, JavaScript)
- ✅ `dist/` - Compiled JavaScript (needed by browser)
**What's NOT accessible via web:**
- ❌ `src/` - TypeScript source code
- ❌ `docs/` - Documentation (for developers only)
- ❌ `node_modules/` - Node.js dependencies
- ❌ Configuration files (package.json, tsconfig.json, etc.)
This is configured in `compose.yaml` with specific volume mounts.
### For Production Deployment
When deploying to production:
1. Verify only `public/` and `dist/` are web-accessible
2. Ensure `src/` and `docs/` are never served by web server
3. Use HTTPS/SSL for all connections
4. Consider adding authentication
5. Review and harden nginx.conf
---
## Troubleshooting
### Module Script MIME Type Errors
**Error:**
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
```
**Cause:** Containers weren't rebuilt after code changes, or build failed.
**Solution:**
```bash
cd /opt/thermal-software
docker-compose down
docker-compose up -d --build
```
The `--build` flag forces a rebuild, which recompiles TypeScript.
### Checking Build Status
**Verify TypeScript was compiled:**
```bash
# Check if dist files exist in container
docker exec thermal-app ls /usr/src/app/refractory/dist/calculators/
# Check build logs
docker logs thermal-app | grep "npm run build"
```
### Module Not Found Errors
**Error:** Import statements failing in browser console
**Check:**
1. Ensure containers are running: `docker ps`
2. Verify build succeeded: `docker logs thermal-app`
3. Check import paths use `dist/` not `src/`
4. Rebuild containers: `docker-compose up -d --build`
### Container Won't Start
**Solution:**
```bash
cd /opt/thermal-software
make down
make up
```
Or with full rebuild:
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d --build
```
