/**
 * Blend Optimizer Algorithm
 *
 * Comprehensive particle size distribution (PSD) optimization for refractory blends
 * Integrates PSD calculation, packing models, and shrinkage prediction
 *
 * Date: February 2, 2026
 * Source: backend/src/modules/refractory/services/particle-packing/blend-optimizer.service.ts
 */

# Blend Optimizer Algorithm

**Date:** February 2, 2026  
**Version:** 1.0  
**Status:** Complete

---

## Overview

The Blend Optimizer Service optimizes particle size distribution (PSD) blends for refractory materials using a multi-stage approach that combines three core algorithms:

1. **PSD Calculation** - Determines optimal particle size distribution
2. **Packing Model** - Calculates maximum packing density
3. **Shrinkage Prediction** - Predicts shrinkage during firing

### Key Concept

**Optimal blend** = Best combination of:
- PSD method (Andreasen or Funk-Dinger)
- Distribution modulus (q value: 0.25-0.35)
- Packing model (CPM or Furnas)
- Compaction scenario (Self-compacting, Flowable, Vibratable, Hand-pressable)

---

## Topic index

| Doc | Contents |
|-----|----------|
| [blend-optimizer-model-and-steps.md](./blend-optimizer-model-and-steps.md) | Problem, physical model, step-by-step algorithm, compaction scenarios |
| [blend-optimizer-integration-and-water.md](./blend-optimizer-integration-and-water.md) | Integration, examples, metrics, water demand, validation, references |

