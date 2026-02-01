# Thermal Software

A collection of thermal calculation utilities for industrial applications.

## Features

### 1. Quenching Process Calculations
- Intensive quenching during nucleate boiling
- Oil cooling calculations
- Core temperature timeline analysis
- Future plans: visualization, air cooling, cooling curve parsing, CCT diagram integration

### 2. Furnace Combustion Model
- Recuperator calculations for coal furnaces
- Multiple recuperator configurations
- Analysis of size, burning power, materials, and geometry
- Optimization for fuel efficiency and burning temperature

### 3. Refractory Calculator
- Chemical composition analysis
- Particle size fraction calculations
- Phase equilibrium calculations
- Component participation analysis
- Support for various sieve standards (ASTM, ISO, FEPA)

## Installation

### Prerequisites
- Docker
- Docker Compose

### Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd thermal-software
```

2. Start the services:
```bash
make up
```

3. Access the applications:
   - **Refractory Calculator Web Interface**: http://localhost:18080/calculator.html
   - **Thermal App (Node.js)**: Container running on port 3010

### Managing Services

Use the Makefile for easy service management:

```bash
make up          # Start all services
make down        # Stop and remove containers
make stop        # Stop containers (without removing)
make start       # Start existing containers
make restart     # Restart all services
make logs        # View service logs
make status      # Show container status
make shell       # Access thermal-app container
make clean       # Stop and remove everything including volumes
make help        # Show all available commands
```

Or use Docker Compose directly:

```bash
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs -f    # View logs
```

## Project Structure

```
thermal-software/
├── compose.yaml              # Docker Compose configuration
├── furnaceCombustion/        # Furnace combustion models
├── refractory/               # Refractory calculator module
│   ├── classes/              # Calculator classes
│   ├── constants/            # Constants definitions
│   ├── data/                 # Component and composition data
│   ├── examples/             # Usage examples
│   └── docs/                 # Documentation
├── scripts/                  # Utility scripts
└── styles/                   # CSS styles
```

## Usage

### Docker Services

The project includes two Docker services:

1. **thermal-app**: Node.js environment with access to:
   - Furnace combustion models at `/usr/src/app/src`
   - Refractory calculator at `/usr/src/app/refractory`

2. **refractory-calculator**: Nginx web server serving the refractory calculator web interface

### Development

To access the thermal-app container for development:

```bash
make shell
# or
docker exec -it thermal-app sh
```

To run a command in the container:

```bash
make exec CMD="node /usr/src/app/refractory/examples/examples_with_dictionary.js"
```

Inside the container, you can run Node.js scripts and access all mounted modules.

## Documentation

- [Refractory Calculator Documentation](./refractory/docs/)
- [Furnace Combustion Specification](./furnaceCombustion/spec.md)

## Troubleshooting

### Refractory Calculator - "Error loading variants"

If you see an error loading variants in the web interface, ensure that:
1. All JavaScript modules are loaded in the correct order in the HTML
2. The modules export to both Node.js (`module.exports`) and browser (`window` object)
3. The script loading order is:
   - ChemicalCompositions.js
   - ParticleSizeFractions.js  
   - RefractoryCalculatorV2.js
   - ComponentsDictionary.js

This has been fixed in the current version.

## Contributing

This is a work in progress. Contributions, refactoring suggestions, and proper resource citations are welcome.

## License

[Add license information]
