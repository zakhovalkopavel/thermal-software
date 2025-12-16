# Documentation Index

Complete documentation for the Refractory Calculator project.

## Quick Links

- **[Installation Guide](INSTALLATION.md)** - Get started with Docker
- **[API Reference](API.md)** - Programming interface
- **[Project Structure](PROJECT_STRUCTURE.md)** - Architecture overview
- **[Project Status](PROJECT_STATUS.md)** - Development history

## Concepts

Essential physics and chemistry concepts:

- **[Liquid vs Glass](concepts/LIQUID_VS_GLASS_EXPLAINED.md)** - Why 5% liquid ≠ 43% glass
- **[Thermal Cycling](concepts/THERMAL_CYCLING_EXPLAINED.md)** - Behavior during reheating

## Algorithms

Implementation details:

- **[Phase Equilibrium](algorithms/FULL_PHASE_EQUILIBRIUM.md)** - Full recalculation method
- **[Multi-Model Standards](algorithms/MULTI_MODEL_COMPLETE.md)** - EN ISO, ASTM, GOST

## Main Documentation

- **[README.md](../README.md)** - Project overview and quick start
- **[spec.md](../spec.md)** - Complete technical specification  

## Platform

- **Runtime:** Node.js 24
- **Language:** TypeScript 5.x
- **Deployment:** Docker Compose

## Support

For questions or issues, see the main [README](../README.md) or check [troubleshooting](INSTALLATION.md#troubleshooting).

---

**Note:** Implementation logs and issue resolution reports are in `../.logs/` (excluded from git)

## Structure

### `/concepts/` - Conceptual Explanations

Important concepts and physics explanations that help understand the calculator behavior:

- **LIQUID_VS_GLASS_EXPLAINED.md** - Critical distinction between liquid phase at temperature vs glass in final microstructure
- **THERMAL_CYCLING_EXPLAINED.md** - What happens during repeated heating/cooling cycles and microstructure evolution

### `/algorithms/` - Algorithm Documentation

Detailed explanations of calculation methods and models:

- **FULL_PHASE_EQUILIBRIUM.md** - Full phase equilibrium recalculation for refractoriness standards (vs simplified approximations)
- **MULTI_MODEL_COMPLETE.md** - Multi-model refractoriness standards implementation (EN ISO 1893, ASTM C24/C71, GOST 4069-69)

### `/issues-resolved/` - Problem Resolution Log

Documentation of issues encountered and how they were resolved (learning from wrong approaches):

- **USER_ISSUE_RESOLVED.md** - Resolution of physics model issues
- **CALCULATION_FIXES_APPLIED.md** - Fixes for unrealistic liquid fractions
- **CALCULATION_ISSUES.md** - Original problem identification and analysis

### Root Level Documentation

- **API.md** - API reference for using the calculator
- **INSTALLATION.md** - Installation instructions
- **PROJECT_STRUCTURE.md** - Project architecture and organization

## Quick Navigation

### Understanding Results
1. Start with [LIQUID_VS_GLASS_EXPLAINED.md](concepts/LIQUID_VS_GLASS_EXPLAINED.md) to understand why liquid% ≠ glass%
2. Read [THERMAL_CYCLING_EXPLAINED.md](concepts/THERMAL_CYCLING_EXPLAINED.md) for long-term behavior

### Understanding Algorithms
1. [FULL_PHASE_EQUILIBRIUM.md](algorithms/FULL_PHASE_EQUILIBRIUM.md) - How liquid fractions are calculated accurately
2. [MULTI_MODEL_COMPLETE.md](algorithms/MULTI_MODEL_COMPLETE.md) - How refractoriness standards are predicted

### Learning from Issues
1. [USER_ISSUE_RESOLVED.md](issues-resolved/USER_ISSUE_RESOLVED.md) - Main physics model improvements
2. [CALCULATION_FIXES_APPLIED.md](issues-resolved/CALCULATION_FIXES_APPLIED.md) - Technical fixes applied

## Key Concepts

### Phase States

**At Temperature (e.g., 1450°C):**
- Liquid: 5.53% (molten, flowing)
- Solid: 94.47% (crystalline + some disorder)

**After Cooling (Room Temperature):**
- Glass: 43.7% (frozen liquid + vitrified material)
- Mullite: 39.9% (crystalline)
- Quartz: 13.0% (crystalline)
- Other: 3.4%

These are **different conditions**, not contradictory!

### Calculation Methods

**Phase Equilibrium:**
- Full recalculation at each temperature
- Selective melting (flux phases first)
- Non-linear liquid formation

**Refractoriness Standards:**
- 4 physical models working together
- Model attribution for each result
- EN ISO 1893, ASTM C24/C71, GOST 4069-69

### Glass Viscosity

**6 Fixed Points (ASTM C965):**
- Melting: 10 poise = 1 Pa·s
- Flow: 10⁵ poise = 10⁴ Pa·s
- Working: 10⁴ poise = 10³ Pa·s
- Softening: 10^7.6 poise = 10^6.6 Pa·s
- Annealing: 10¹³ poise = 10¹² Pa·s
- Strain: 10^14.5 poise = 10^13.5 Pa·s

## References

All calculation methods include references to:
- International standards (EN ISO, ASTM, GOST)
- Scientific literature (Giordano et al., Kingery et al., etc.)
- Industry handbooks

See individual algorithm documentation for specific citations.

## Version

Documentation current as of: December 16, 2025  
Calculator version: 1.0.0  
Status: Production ready

