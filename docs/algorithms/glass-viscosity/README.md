# Glass Viscosity Fixed Points Specification - Chapter Index

**Version:** 2.0  
**Date:** February 6, 2026  
**Status:** Specification Complete - Implementation Pending

---

## Overview

This specification describes the implementation of composition-dependent viscosity models for glass and slag systems, with analytical/numerical methods for calculating ASTM C965-96 fixed points.

## Chapter Structure

### Part I: Problem Definition and Background
- **Chapter 1:** [Current Implementation Issues](./chapter-01-current-issues.md)
- **Chapter 2:** [ASTM Standards and Fixed Points](./chapter-02-astm-standards.md)

### Part II: Composition-Dependent Models
- **Chapter 3:** [Model Selection Framework](./chapter-03-model-selection.md)
- **Chapter 4:** [Soda-Lime-Silica System](./chapter-04-soda-lime-silica.md)
- **Chapter 5:** [Borosilicate System](./chapter-05-borosilicate.md)
- **Chapter 6:** [High-Alumina System](./chapter-06-aluminosilicate.md)
- **Chapter 7:** [Lead Glass System](./chapter-07-lead-glass.md)
- **Chapter 8:** [Slag Systems](./chapter-08-slags.md)
- **Chapter 9:** [Specialty Systems](./chapter-09-specialty-systems.md)
- **Chapter 10:** [Component Interactions](./chapter-10-component-interactions.md)

### Part III: Implementation
- **Chapter 11:** [Mathematical Methods](./chapter-11-mathematical-methods.md)
- **Chapter 12:** [Implementation Steps](./chapter-12-implementation-steps.md)
- **Chapter 13:** [Output Structures](./chapter-13-output-structures.md)

### Part IV: Validation
- **Chapter 14:** [Validation Dataset](./chapter-14-validation-dataset.md)
- **Chapter 15:** [Extended Examples](./chapter-15-extended-examples.md)
- **Chapter 16:** [Test Requirements](./chapter-16-test-requirements.md)

### Part V: Reference
- **Chapter 17:** [Literature References](./chapter-17-references.md)
- **Chapter 18:** [Model Limitations](./chapter-18-limitations.md)

---

## Quick Start Guide

**For implementation:**
1. Start with Chapter 1-2 (understand the problem)
2. Read Chapter 3 (model selection framework)
3. Implement Priority 1 systems (Chapters 4-5)
4. Follow Chapter 12 (step-by-step implementation)
5. Validate with Chapter 14-15 (datasets and examples)

**For understanding accuracy:**
- See Chapter 3: Model accuracy table
- See Chapter 18: Limitations and appropriate use

**For specific glass systems:**
- Soda-lime glass → Chapter 4
- Laboratory glass → Chapter 5
- Refractory → Chapter 6
- Crystal glass → Chapter 7
- Metallurgical → Chapter 8

---

## Target File

**Service:** `backend/src/modules/refractory/services/glass-viscosity.service.ts`

**Related Files:**
- `backend/src/modules/refractory/data/component-properties.ts`
- `backend/src/modules/refractory/interfaces/glass-viscosity.interface.ts`
- `backend/test/unit/refractory/services/glass-viscosity.service.spec.ts`

---

**Last Updated:** February 6, 2026

