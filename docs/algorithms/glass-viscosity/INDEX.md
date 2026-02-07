# Glass Viscosity Fixed Points - Specification Chapters

## Navigation

**START HERE:** [README.md - Chapter Index](./README.md)

This specification has been divided into focused chapters for easier implementation and reference.

---

## All Chapters

### Part I: Problem Definition and Background
1. [Current Implementation Issues](./chapter-01-current-issues.md)
2. [ASTM Standards and Fixed Points](./chapter-02-astm-standards.md)

### Part II: Composition-Dependent Models  
3. [Model Selection Framework](./chapter-03-model-selection.md) ✅ **Created**
4. [Soda-Lime-Silica System](./chapter-04-soda-lime-silica.md) ✅ **Created**
5. [Borosilicate System](./chapter-05-borosilicate.md) ✅ **Created**
6. [High-Alumina System](./chapter-06-aluminosilicate.md) ✅ **Created**
7. [Lead Glass System](./chapter-07-lead-glass.md) ✅ **Created**
8. [Slag Systems](./chapter-08-slags.md) ✅ **Created**
9. [Specialty Systems](./chapter-09-specialty-systems.md) ✅ **Created**
10. [Component Interactions](./chapter-10-component-interactions.md) ✅ **Created**

### Part III: Implementation
11. [Mathematical Methods](./chapter-11-mathematical-methods.md) ✅ **Created**
12. [Implementation Steps](./chapter-12-implementation-steps.md) ✅ **Created**
13. [Output Structures](./chapter-13-output-structures.md) ✅ **Created**

### Part IV: Validation
14. [Validation Dataset](./chapter-14-validation-dataset.md) ✅ **Created**
15. [Extended Examples](./chapter-15-extended-examples.md) ✅ **Created with 12+ measured examples**
16. [Test Requirements](./chapter-16-test-requirements.md) ✅ **Created**

### Part V: Reference
17. [Literature References](./chapter-17-references.md) ✅ **Created**
18. [Model Limitations](./chapter-18-limitations.md) ✅ **Created**

---

## Currently Available

### ✅ Completed Chapters

1. **Chapter 1: Current Implementation Issues**
   - Analysis of current glass-viscosity.service.ts
   - 5 critical problems identified
   - Root cause analysis
   - Requirements for fix

2. **Chapter 2: ASTM Standards and Fixed Points**
   - ASTM C965-96 standard details
   - Unit conversion (poise vs Pa·s)
   - 6 fixed points defined
   - Measurement methods
   - Typical values by glass type

3. **Chapter 3: Model Selection Framework**
   - 8 glass system types
   - Decision tree for system detection
   - VFT vs Arrhenius model types
   - Confidence levels and extrapolation risk
   - Composition range validation

4. **Chapter 4: Soda-Lime-Silica System**
   - Most important system (70% of production)
   - VFT parameters and component effects
   - MgO acts as network former (critical note)
   - Measured data from Lakatos 1972
   - Common variants (amber, green, float glass)

5. **Chapter 5: Borosilicate System**
   - Second most important commercial system
   - NIST SRM 717a reference standard
   - Boron anomaly effects and R ratio
   - Complete measured data with uncertainties
   - Thermal shock resistance properties

6. **Chapter 6: Aluminosilicate System**
   - High-alumina glasses (15-30% Al2O3)
   - E-glass fiber composition and properties
   - Alumina coordination dependency (R ratio)
   - Geological melt applications
   - High-temperature resistant glass

7. **Chapter 7: Lead Glass System**
   - Lead crystal (20-40% PbO)
   - Arrhenius model (not VFT)
   - Very low processing temperatures
   - Environmental and safety warnings
   - Optical glass applications

8. **Chapter 8: Slag Systems**
   - Metallurgical melts (NOT glass)
   - Blast furnace, steelmaking, coal ash
   - Urbain/Riboud models
   - Valid ONLY above liquidus (>1300°C)
   - Basicity index calculations

9. **Chapter 9: Specialty Systems**
   - Pure silica (>99% SiO2)
   - Sodium silicate binaries
   - Fluoride glasses
   - Oxyhalide glasses
   - Complete parameter sets

10. **Chapter 10: Component Interactions**
   - Mixed alkali effect (Na+K synergy)
   - Boron anomaly (coordination change)
   - Alumina coordination (R ratio effects)
   - Iron redox equilibria
   - Fluorine bridging
   - Application order and correction factors

7. **Chapter 11: Mathematical Methods**
   - Forward problem (T → η) for VFT and Arrhenius
   - Inverse problem (η → T) with analytical solutions
   - Newton-Raphson as general utility (NOT refractory-specific)
   - Fixed points calculation (all 6 ASTM points)
   - Round-trip verification
   - Error handling and validation

8. **Chapter 12: Implementation Steps**
   - Phase 1: Composition range detection (1 day)
   - Phase 2: System-specific parameters (1-2 days)
   - Phase 3: Enhanced viscosity calculation (1-2 days)
   - Detailed TypeScript code examples
   - Test specifications for each phase
   - Total estimated time: 11-16 days

9. **Chapter 13: Output Structures**
   - Complete interface definitions
   - ViscosityResult with all fields
   - Model information and parameters
   - Validation status with confidence levels
   - Component breakdown by role
   - Error handling and type guards

10. **Chapter 14: Validation Dataset**
   - 14 validation compositions from literature
   - 128 measured viscosity-temperature data points
   - Coverage of all 8 glass system types
   - NIST SRM 717a reference standard
   - Complete test procedures
   - Acceptance criteria per system

11. **Chapter 15: Extended Examples**
   - **12+ real-world compositions** with complete measured data
   - Commercial container glasses (3 variations)
   - Laboratory glasses (Pyrex, LCD glass, E-glass)
   - Specialty glasses (fused silica, bioactive glass)
   - Heavy metal glasses (lead crystal, barium crown)
   - Each example includes:
     - Full composition
     - 10-30 temperature-viscosity data points
     - Measurement methods
     - ASTM fixed points (measured)
     - VFT/Arrhenius parameters
     - Practical notes

12. **Chapter 16: Test Requirements**
   - Complete test specifications
   - Unit tests for all public methods
   - System detection tests
   - Viscosity calculation tests
   - Fixed points accuracy tests
   - Integration tests
   - Performance requirements
   - Coverage targets (90%+ statements)

13. **Chapter 17: Literature References**
   - 26 primary references with DOI links
   - Organized by glass system type
   - ASTM standards documentation
   - Access information (free/library/purchase)
   - Key data and page numbers
   - Recommended priority reading

14. **Chapter 18: Model Limitations**
   - Composition range restrictions
   - Temperature range limitations
   - System-specific limitations
   - Physical assumptions
   - When NOT to use models
   - Error expectations summary
   - Best practices

---

## Original Combined Specification

The original full specification (before chapter division) is preserved in:
- [FULL_SPEC_ORIGINAL.md](./FULL_SPEC_ORIGINAL.md)

This contains all the content that will be divided into chapters 3-18.

---

## Implementation Progress

### Phase 1: Documentation ✅ **100% COMPLETE**
- [x] Divide spec into 18 chapters
- [x] Create chapter index and navigation
- [x] Add 12+ measured examples (174 data points)
- [x] Add 14 validation compositions (128 data points)
- [x] Create implementation steps guide
- [x] Complete all glass system chapters
- [x] Add literature references
- [x] Document limitations

### Phase 2: Core Implementation ✅ **100% COMPLETE**
- [x] Chapter 1: Problem analysis
- [x] Chapter 2: ASTM standards
- [x] Chapter 3: Model selection framework
- [x] Chapter 4: Soda-lime-silica system
- [x] Chapter 5: Borosilicate system
- [x] Chapter 6: Aluminosilicate (high-alumina) system
- [x] Chapter 7: Lead glass system
- [x] Chapter 8: Slag systems
- [x] Chapter 9: Specialty systems (pure silica, binaries, fluorides)
- [x] Chapter 10: Component interactions
- [x] Chapter 11: Mathematical methods (with general Newton-Raphson utility)
- [x] Chapter 12: Implementation guide
- [x] Chapter 13: Output structures
- [x] Chapter 14: Validation dataset (14 compositions, 128 data points)
- [x] Chapter 15: Extended examples
- [x] Chapter 16: Test requirements (complete test specifications)
- [x] Chapter 17: Literature references (26 references with DOIs)
- [x] Chapter 18: Model limitations (complete documentation)

### Phase 3: Code Implementation (Not Started)
- [ ] Implement Phase 1-3 from Chapter 12
- [ ] Implement system-specific models
- [ ] Validate against Chapter 15 examples
- [ ] Complete test suite

---

## Quick Links

**For developers implementing:**
→ Start with [Chapter 12 - Implementation Steps](./chapter-12-implementation-steps.md)

**For validation:**
→ Use [Chapter 15 - Extended Examples](./chapter-15-extended-examples.md)

**For understanding the problem:**
→ Read [Chapter 1 - Current Issues](./chapter-01-current-issues.md)

**For ASTM compliance:**
→ See [Chapter 2 - ASTM Standards](./chapter-02-astm-standards.md)

---

**Last Updated:** February 6, 2026

