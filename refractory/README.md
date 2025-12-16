# Refractory Calculator

A TypeScript-based calculator for predicting refractory material properties including phase equilibrium, viscosity, and refractoriness standards.

## Quick Start

```bash
make up        # Start all services
make build     # Build TypeScript
make test      # Run tests
make down      # Stop all services
```

## Features

- **Phase Equilibrium** - Full thermodynamic calculations at each temperature
- **Multi-Model Refractoriness** - EN ISO 1893, ASTM C24/C71, GOST 4069-69
- **Glass Viscosity** - ASTM C965 fixed points with multiple models
- **Mineral Phases** - Identifies mullite, corundum, quartz, etc.
- **Web Interface** - Interactive calculator at http://localhost:18080

## Requirements

- Docker & Docker Compose
- Make (for convenience commands)

**Platform:**
- Node.js 24
- TypeScript 5.x

## Architecture

- **Language:** TypeScript 5.x
- **Runtime:** Node.js 24 (Alpine Linux)
- **Build:** Native TypeScript compiler
- **Web Server:** Nginx (Alpine)
- **Deployment:** Docker Compose

## Documentation

- **[Technical Specification](spec.md)** - Complete physics models and algorithms
- **[API Reference](docs/API.md)** - Programming interface
- **[Concepts](docs/concepts/)** - Understanding liquid vs glass, thermal cycling
- **[Algorithms](docs/algorithms/)** - Implementation details

## Project Status

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** December 16, 2025

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed development history.

## License

MIT

