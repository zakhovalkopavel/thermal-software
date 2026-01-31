# Blend Optimizer User Guide
**Version:** 1.1.0  
**Last Updated:** January 31, 2026
---
## Overview
The Blend Optimizer helps you design optimal particle size distributions for refractory castables. It predicts packing, shrinkage, and other properties to help you create high-performance formulations.
---
## Quick Start
### 1. Access the Optimizer
Navigate to: `http://localhost:18080/blend-optimizer.html`
### 2. Add Fractions
Click "Add Fraction" to define particle size ranges. Add at least 3 fractions:
**Example:**
- Fraction 1: 3-6 mm (Coarse)
- Fraction 2: 1-3 mm (Medium)
- Fraction 3: 0.1-1 mm (Fine)
### 3. Select Materials
For each fraction, choose a material from the dropdown (e.g., Chamotte, Alumina, CAC).
### 4. Set Optimization Parameters
- **Method:** Andreasen or Funk-Dinger
- **q value:** 0.25 (self-compacting) to 0.33 (hand-pressed)
- **Scenario:** Self-compacting, Flowable, Vibratable, or Hand-pressable
### 5. Optimize
Click "Optimize Blend" to calculate the optimal distribution.
### 6. Review Results
The optimizer shows:
- Optimized mass percentages
- Packing fraction and porosity
- Bulk density
- Shrinkage predictions at multiple temperatures
### 7. Save to Library
Click "Save This Variant" to store the mix in your custom library for future use.
---
## Features
### PSD Models
- **Andreasen:** Classical model for optimal packing
- **Funk-Dinger:** Better for fine particles and cements
### Packing Calculators
- **CPM:** Advanced model accounting for compaction
- **Furnas:** Simple sequential filling model
### Shrinkage Prediction
- **Chemical:** From cement hydration/dehydration
- **Sintering:** Master Sintering Curve (MSC) model
### Mix Library
- Save successful formulations
- Add metadata (name, description, tags, category)
- Export/import as JSON
- Search and filter saved mixes
---
## Detailed Guides
For more information, see:
- **[BLEND_OPTIMIZATION_EXPLAINED.md](concepts/BLEND_OPTIMIZATION_EXPLAINED.md)** - Complete workflow
- **[PSD_ALGORITHMS.md](algorithms/PSD_ALGORITHMS.md)** - Mathematical details
- **[PACKING_MODELS.md](algorithms/PACKING_MODELS.md)** - Packing theory
- **[SHRINKAGE_EXPLAINED.md](concepts/SHRINKAGE_EXPLAINED.md)** - Shrinkage mechanisms
---
## Tips
**Getting Good Results:**
1. Use 4-6 size fractions for best results
2. Ensure continuous size distribution (no gaps)
3. Start with q=0.25 for self-compacting
4. Validate predictions experimentally
**Troubleshooting:**
- If packing too low: Check size distribution, add more fractions
- If shrinkage too high: Reduce cement, increase q value
- If results unrealistic: Verify material properties
---
**For complete information, see the concepts and algorithms documentation.**
