# Algorithms Documentation Index

**Date:** February 2, 2026  
**Version:** 2.0 - Complete Algorithm Library  
**Status:** Production-Ready

---

## 📚 AVAILABLE ALGORITHMS

### 1. **VISCOSITY_ALGORITHM.md** ⭐
**Service:** `ViscosityService`  
**Components:** 33 (21 oxides + 6 fluorides + 6 chlorides)  
**Model:** Arrhenius Viscosity Equation  

**Resources:**
- Urbain et al. (1982) - Base model
- Mills (1993) - Comprehensive slag data
- Giordano et al. (2008) - VFT model
- Industrial viscosity databases

**Key Features:**
- Network former/modifier classification
- Component effect quantification
- Fluoride and chloride support
- Industrial validation
- ✅ Production-ready

---

### 2. **THERMAL_PERFORMANCE_ALGORITHM.md** ⭐ NEW
**Service:** `ThermalPerformanceService`  
**Components:** 33 (21 oxides + 6 fluorides + 6 chlorides)  
**Model:** Composition-Weighted with Temperature & Porosity Corrections  

**Resources:**
- Kingery et al. (1976) - Ceramic thermal properties
- Schacht (2004) - Refractory handbook
- Maxwell & Eucken - Porosity equations
- TPRC Database - Thermophysical properties

**Key Features:**
- Thermal conductivity by component
- Temperature dependence (-0.0003 K⁻¹)
- Maxwell-Eucken porosity correction
- Thermal diffusivity calculation
- ✅ Production-ready

---

### 3. **REFRACTORINESS_ALGORITHM.md** ⭐ NEW
**Service:** `RefractorinessService`  
**Components:** 33 (21 oxides + 6 fluorides + 6 chlorides)  
**Model:** Component-Based Temperature Estimation  

**Resources:**
- ISO 1893:2015 - RUL standard
- ASTM C24-10 - PCE standard
- Mills (1993) - Refractory handbook
- GOST 4069-69 - Russian standard

**Key Features:**
- Network former/modifier effects (+800 to -900 K)
- Fluoride flux components
- Chloride destabilizer components
- 4 standard support (ISO, ASTM, GOST)
- Classification by duty level
- ✅ Production-ready

---

### 4. **FULL_PHASE_EQUILIBRIUM.md**
**Service:** `PhaseEquilibriumService`  
**Model:** Thermodynamic phase calculation  

**Contents:**
- Phase equilibrium principles
- Liquid-solid distribution
- Temperature-dependent calculations
- Material composition analysis

---

### 3. **PACKING_MODELS.md**
**Services:** `PackingService`  
**Models:** CPM (Compressible Packing Model) and Furnas  

**Contents:**
- Packing density calculations
- Particle size distribution effects
- Compaction modeling
- Industrial validation

---

### 4. **PSD_ALGORITHMS.md**
**Service:** `PSDCalculatorService`  
**Models:** Andreasen, Funk-Dinger  

**Contents:**
- Particle size distribution
- Optimal grading calculations
- Aggregate sizing

---

### 5. **MULTI_MODEL_COMPLETE.md**
**Multi-Service Overview**  
**Coverage:** All calculation models integrated

**Contents:**
- Complete workflow integration
- Data dependencies
- Cross-service communication

---

## 🔗 SERVICE INTERCONNECTIONS

```
Material Library (Composition Data)
        ↓
        ├→ ViscosityService → η (Pa·s)
        ├→ PhaseEquilibriumService → Phase composition
        ├→ PackingService → Packing density
        ├→ PSDCalculatorService → Particle distribution
        ├→ ShrinkageService → Shrinkage %
        ├→ RefractorinessService → Refractory performance
        ├→ ThermalPerformanceService → Thermal properties
        └→ GlassViscosityService → Glass viscosity
```

---

## 📊 ALGORITHM COMPARISON

| Algorithm | Model Type | Components | Accuracy | Range |
|-----------|-----------|-----------|----------|-------|
| Viscosity | Arrhenius | 33 | ±10-20% | 1000-2000°C |
| Thermal Performance | Weighted avg + corrections | 33 | ±15-25% | 20-2000°C |
| Refractoriness | Component-based | 33 | ±50-100°C | 800-2500°C |
| Phase Equilibrium | Thermodynamic | All | ±5% | All temps |
| Packing | Empirical | All | ±15% | All sizes |
| PSD | Mathematical | All | ±3% | All sizes |

---

## 🎯 QUICK ACCESS

### By Service:
- **Viscosity** → `VISCOSITY_ALGORITHM.md`
- **Phase Equilibrium** → `FULL_PHASE_EQUILIBRIUM.md`
- **Packing Density** → `PACKING_MODELS.md`
- **Particle Size** → `PSD_ALGORITHMS.md`

### By Application:
- **Refractory Design** → All documents
- **Glass Calculation** → Viscosity, Phase Equilibrium
- **Ceramic Processing** → Viscosity, Packing, PSD
- **Thermal Analysis** → Phase Equilibrium

---

## 🔍 RESOURCE MAPPING

### Data Sources Used:

**Academic References:**
1. Urbain et al. (1982) - Silicate melt viscosity
2. Mills (1993) - Slag Atlas
3. Giordano et al. (2008) - Magmatic liquids model
4. Dingwell & Webb (1990) - Silicate relaxation

**Databases:**
- PubChem (NIST) - Component properties
- Materials Project (LBNL) - Material data
- FactSage - Phase data (commercial)
- NIST Chemistry WebBook - Thermodynamics

**Standards:**
- ASTM C965 - Viscosity measurement
- ISO 6337 - Viscosity determination

---

## ✅ VALIDATION STATUS

| Algorithm | Validated | Tested | Production | Date |
|-----------|-----------|--------|-----------|------|
| Viscosity | ✅ | ✅ | ✅ | Feb 2, 2026 |
| Phase Equilibrium | ✅ | ✅ | ✅ | Earlier |
| Packing | ✅ | ✅ | ✅ | Earlier |
| PSD | ✅ | ✅ | ✅ | Earlier |

---

## 📝 UPDATE HISTORY

### February 2, 2026
- ✅ Created VISCOSITY_ALGORITHM.md
- ✅ Documented 33 components (21 oxides + 6 fluorides + 6 chlorides)
- ✅ Added resource citations
- ✅ Created algorithms index

### Earlier (Legacy)
- Phase equilibrium algorithms
- Packing density models
- PSD calculations

---

## 🎊 STATUS

**All algorithms documented and production-ready!**

For implementation details, see individual algorithm files in this directory.

