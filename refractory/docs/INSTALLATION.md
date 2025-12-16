# Installation

## Requirements

- **Docker** & **Docker Compose**
- **Node.js** 24+ (if running locally)
- **Make** (optional, for convenience commands)

## Quick Start (Docker)

```bash
# Clone repository
git clone <repository-url>
cd thermal-software/refractory

# Start services
make up

# Access calculator
open http://localhost:18080/public/
```

That's it! Everything is installed and built automatically.

## Development

```bash
# Watch mode (auto-rebuild on changes)
make dev

# Run tests
make test

# View logs
make logs

# Stop services
make down
```

## Local Development (without Docker)

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Development with watch
npm run dev
```

## Troubleshooting

**Build fails:**
```bash
make clean
make build
```

**Can't access web interface:**
- Check http://localhost:18080/public/
- Ensure dist/ folder exists: `make build`

For more help, see [main README](../README.md). & Setup Guide

**Refractory Calculator v2.0**  
**Last Updated:** December 15, 2025

---

## 📋 Prerequisites

### Required
- **Node.js** >= 12.0.0 (for command-line and server use)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge) for HTML interface

### Optional
- **Docker** >= 20.10.0 (for containerized deployment)
- **Docker Compose** >= 1.29.0 (for multi-container setup)

---

## 🚀 Quick Start

### Option 1: Browser Only (No Installation Required)

1. Open `calculator.html` in any modern web browser
2. Select components and set temperature
3. Click "Calculate" to see results

```bash
# Open in default browser
xdg-open /opt/thermal-software/refractory/calculator.html
# or
open /opt/thermal-software/refractory/calculator.html
```

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

