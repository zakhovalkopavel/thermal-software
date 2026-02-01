c# Sieve Standards Reference Guide

**Version:** 1.0.0  
**Date:** December 15, 2025

---

## 📏 Available Sieve Standards

This module now includes comprehensive sieve size standards used worldwide in the refractory, ceramic, and abrasive industries.

---

## 🇺🇸 ASTM E11 Standard (US Standard)

**Full name:** ASTM E11 - Standard Specification for Woven Wire Test Sieve Cloth and Test Sieves

### Coverage
- **Coarse sieves:** 125 mm (5") down to 6.3 mm (1/4")
- **Fine sieves (mesh):** Mesh #3.5 (5.6 mm) to Mesh #635 (0.02 mm)
- **Total designations:** 73 standard sizes

### Usage
```javascript
const Fractions = require('./data/fractions/ParticleSizeFractions.js');

// Get specific sieve size
const size = Fractions.getSieveSize('ASTM', 'mesh_100');
console.log(size); // 0.15 mm

// List all ASTM sieves
const allSieves = Fractions.listSieveSizes('ASTM');
```

### Common ASTM Sieves for Refractories

| Mesh # | Opening (mm) | Opening (µm) | Typical Use |
|--------|--------------|--------------|-------------|
| 4 | 4.75 | 4750 | Coarse aggregate |
| 8 | 2.36 | 2360 | Medium aggregate |
| 16 | 1.18 | 1180 | Fine aggregate |
| 30 | 0.6 | 600 | Fine sand |
| 50 | 0.3 | 300 | Very fine sand |
| 100 | 0.15 | 150 | Fine powder |
| 200 | 0.075 | 75 | Very fine powder |
| 325 | 0.045 | 45 | Ultra-fine powder |
| 635 | 0.02 | 20 | Sub-silt size |

---

## 🇪🇺 ISO 3310-1 Standard (International)

**Full name:** ISO 3310-1 - Test sieves — Technical requirements and testing — Part 1: Test sieves of metal wire cloth

### Coverage
- **R20/3 series:** Preferred sizes from 125 mm down to 0.02 mm
- **Total designations:** 79 standard sizes
- **Metric-based:** All sizes in millimeters

### Usage
```javascript
// Get ISO sieve size
const size = Fractions.getSieveSize('ISO', 'iso_0_5');
console.log(size); // 0.5 mm

// Find closest ISO equivalent to ASTM mesh #100
const equiv = Fractions.convertSieveStandard('ASTM', 'mesh_100', 'ISO');
console.log(equiv); // { designation: 'iso_0_16', size: 0.16, difference: 0.01 }
```

### ISO Series Structure

| ISO Designation | Size (mm) | Approximate ASTM Equivalent |
|----------------|-----------|----------------------------|
| iso_5 | 5.0 | Between mesh 4 and 5 |
| iso_2 | 2.0 | Between mesh 8 and 10 |
| iso_1 | 1.0 | Between mesh 16 and 18 |
| iso_0_5 | 0.5 | Between mesh 30 and 35 |
| iso_0_25 | 0.25 | Between mesh 50 and 60 |
| iso_0_125 | 0.125 | Mesh 120 |
| iso_0_063 | 0.063 | Between mesh 200 and 230 |

---

## 🇪🇺 FEPA Standards (Abrasive Grains)

**Full name:** Federation of European Producers of Abrasives

FEPA standards define grain sizes for abrasive materials, widely used for:
- Silicon Carbide (SiC)
- Aluminum Oxide (Al₂O₃)
- Refractory aggregates
- Abrasive products

### Two Series

#### F Series (Macrogrits)
**Range:** F4 (4.89 mm) to F220 (0.053 mm)  
**Use:** Coarse abrasives, refractory aggregates, blasting media

#### P Series (Coated Abrasives)
**Range:** P12 (1.815 mm) to P2500 (0.0082 mm)  
**Use:** Sandpaper, grinding wheels, polishing compounds

### Usage
```javascript
// Get FEPA grit size
const sizeF36 = Fractions.getSieveSize('FEPA', 'F36');
console.log(sizeF36); // 0.525 mm

const sizeP120 = Fractions.getSieveSize('FEPA', 'P120');
console.log(sizeP120); // 0.125 mm

// Find appropriate FEPA grit for a target size
const grit = Fractions.getFEPAGrit(0.3, 'F');
console.log(grit); // { designation: 'F54', size: 0.310, difference: 0.010 }
```

### Common FEPA Grits for Refractories

#### F Series (Macrogrits)

| FEPA Grade | d₅₀ (mm) | d₅₀ (µm) | Typical Application |
|------------|----------|----------|---------------------|
| F4 | 4.890 | 4890 | Very coarse aggregate |
| F8 | 2.460 | 2460 | Coarse aggregate |
| F16 | 1.230 | 1230 | Medium aggregate |
| F24 | 0.745 | 745 | Fine aggregate |
| F36 | 0.525 | 525 | Fine aggregate |
| F46 | 0.370 | 370 | Very fine aggregate |
| F60 | 0.260 | 260 | Fine powder |
| F80 | 0.185 | 185 | Fine powder |
| F100 | 0.129 | 129 | Very fine powder |
| F120 | 0.109 | 109 | Ultra-fine powder |
| F150 | 0.082 | 82 | Sub-silt |
| F220 | 0.053 | 53 | Ultra-fine |

#### P Series (Coated Abrasives)

| FEPA Grade | d₅₀ (mm) | d₅₀ (µm) | Equivalent Grit |
|------------|----------|----------|----------------|
| P12 | 1.815 | 1815 | Very coarse |
| P24 | 0.764 | 764 | Coarse |
| P40 | 0.425 | 425 | Medium-coarse |
| P60 | 0.269 | 269 | Medium |
| P80 | 0.201 | 201 | Medium-fine |
| P120 | 0.125 | 125 | Fine |
| P180 | 0.082 | 82 | Very fine |
| P240 | 0.0585 | 58.5 | Ultra-fine |
| P320 | 0.0463 | 46.3 | Super-fine |
| P600 | 0.0260 | 26.0 | Micro-fine |
| P1200 | 0.0153 | 15.3 | Sub-micron approach |

### FEPA Microgrits (Extra Fine)

| FEPA Grade | d₅₀ (µm) | Application |
|------------|----------|-------------|
| F230 | 44 | Fine polishing |
| F320 | 23 | Ultra-fine polishing |
| F500 | 10 | Lapping compounds |
| F800 | 5 | Fine lapping |
| F1200 | 3 | Ultra-fine lapping |
| F2000 | 1 | Sub-micron polishing |

---

## 🇺🇸 Tyler Standard Screen Scale

**Alternative US standard**, commonly used in mining and mineral processing.

### Coverage
- **Range:** Tyler 2.5 (8.0 mm) to Tyler 400 (0.037 mm)
- **Total designations:** 32 standard sizes

### Usage
```javascript
// Get Tyler sieve size
const size = Fractions.getSieveSize('Tyler', 'tyler_100');
console.log(size); // 0.149 mm
```

### Tyler vs ASTM Comparison

| Tyler | Opening (mm) | Approx. ASTM Mesh |
|-------|--------------|-------------------|
| Tyler 8 | 2.38 | Mesh 8 |
| Tyler 16 | 1.0 | Mesh 18 |
| Tyler 32 | 0.5 | Mesh 35 |
| Tyler 60 | 0.25 | Mesh 60 |
| Tyler 100 | 0.149 | Mesh 100 |
| Tyler 200 | 0.074 | Mesh 200 |

---

## 🔧 Utility Functions

### Get Sieve Size
```javascript
const size = Fractions.getSieveSize('ASTM', 'mesh_100');
// Returns: 0.15 (mm)
```

### Find Closest Sieve
```javascript
const closest = Fractions.findClosestSieve(0.3, 'ASTM');
// Returns: { designation: 'mesh_50', size: 0.3, difference: 0 }
```

### Convert Between Standards
```javascript
const equiv = Fractions.convertSieveStandard('ASTM', 'mesh_100', 'ISO');
// Returns: { designation: 'iso_0_16', size: 0.16, difference: 0.01 }
```

### List All Sieves in a Standard
```javascript
const sieves = Fractions.listSieveSizes('FEPA');
// Returns array sorted by size (largest first)
```

### Create Distribution from Sieve Analysis
```javascript
const sieveData = [
  { sieve: 'mesh_4', retained: 15.0 },
  { sieve: 'mesh_8', retained: 25.0 },
  { sieve: 'mesh_16', retained: 30.0 },
  { sieve: 'mesh_30', retained: 20.0 },
  { sieve: 'mesh_50', retained: 10.0 }
];

const distribution = Fractions.fromSieveAnalysis(sieveData, 'ASTM');
// Returns fractions with characteristic sizes
```

### Get FEPA Grit
```javascript
// For F series (macrogrits)
const fGrit = Fractions.getFEPAGrit(0.5, 'F');
// Returns: { designation: 'F36', size: 0.525, difference: 0.025 }

// For P series (coated abrasives)
const pGrit = Fractions.getFEPAGrit(0.1, 'P');
// Returns: { designation: 'P150', size: 0.100, difference: 0 }
```

---

## 📊 Standard Comparison Chart

### Approximate Equivalencies (Coarse Range)

| Size (mm) | ASTM | ISO | FEPA F | Tyler |
|-----------|------|-----|--------|-------|
| 4.75 | mesh_4 | iso_5 | F6 | tyler_4 |
| 2.36 | mesh_8 | iso_2_5 | F12 | tyler_8 |
| 1.18 | mesh_16 | iso_1_25 | F20 | - |
| 0.6 | mesh_30 | iso_0_63 | F30 | - |
| 0.3 | mesh_50 | iso_0_315 | F54 | tyler_60 |
| 0.15 | mesh_100 | iso_0_16 | F100 | tyler_100 |
| 0.075 | mesh_200 | iso_0_08 | F180 | tyler_200 |

### Approximate Equivalencies (Fine Range)

| Size (µm) | ASTM | ISO | FEPA F | FEPA P |
|-----------|------|-----|--------|--------|
| 125 | mesh_120 | iso_0_125 | F120 | P120 |
| 100 | - | iso_0_1 | - | P150 |
| 75 | mesh_200 | iso_0_08 | F150 | - |
| 63 | mesh_230 | iso_0_063 | - | - |
| 45 | mesh_325 | iso_0_045 | F220 | - |
| 38 | mesh_400 | iso_0_04 | F240 | - |
| 26 | - | - | - | P600 |
| 15 | - | - | - | P1200 |

---

## 💡 Practical Applications

### For Refractory Castables
```javascript
// Typical castable using multiple size fractions
const coarseAgg = Fractions.getSieveSize('ASTM', 'mesh_4');    // 4.75 mm
const mediumAgg = Fractions.getSieveSize('ASTM', 'mesh_8');    // 2.36 mm
const fineAgg = Fractions.getSieveSize('ASTM', 'mesh_30');     // 0.6 mm
const powder = Fractions.getSieveSize('ASTM', 'mesh_200');     // 0.075 mm
```

### For Silicon Carbide Refractories
```javascript
// Use FEPA F series for SiC grains
const sic_coarse = Fractions.getSieveSize('FEPA', 'F24');   // 0.745 mm
const sic_medium = Fractions.getSieveSize('FEPA', 'F46');   // 0.370 mm
const sic_fine = Fractions.getSieveSize('FEPA', 'F80');     // 0.185 mm
```

### For Quality Control
```javascript
// Convert supplier specification to your standard
const supplierSpec = 'F36';  // FEPA specification
const astmEquiv = Fractions.convertSieveStandard('FEPA', 'F36', 'ASTM');
console.log(`${supplierSpec} ≈ ASTM ${astmEquiv.designation}`);
```

---

## 📖 References

### Standards Documents
- **ASTM E11-20:** Standard Specification for Woven Wire Test Sieve Cloth and Test Sieves
- **ISO 3310-1:2016:** Test sieves — Technical requirements and testing
- **FEPA 42-D-1984 (R1993):** Standard for Macrogrits F4 to F220
- **FEPA 43-D-1984 (R1993):** Standard for Microgrits F230 to F2000
- **FEPA 60-D-1985:** Standard for P Series (P12 to P2500)
- **Tyler Standard Screen Scale:** Traditional US standard

### Notes
- **d₅₀** = Median particle size (50% of particles are finer)
- All sizes are **opening sizes** in millimeters unless noted
- FEPA sizes are based on **average grain size** (d₅₀)
- Standards are approximate equivalencies; exact conversions depend on particle shape

---

## ✅ Total Standards Available

| Standard | Count | Range |
|----------|-------|-------|
| **ASTM E11** | 73 sizes | 125 mm → 0.02 mm |
| **ISO 3310-1** | 79 sizes | 125 mm → 0.02 mm |
| **FEPA F Series** | 34 sizes | 4.89 mm → 0.001 mm |
| **FEPA P Series** | 21 sizes | 1.815 mm → 0.0082 mm |
| **Tyler** | 32 sizes | 8.0 mm → 0.037 mm |
| **Total** | **239 standardized sizes** | |

---

**Module:** `/opt/thermal-software/refractory/data/fractions/ParticleSizeFractions.js`  
**Version:** 2.0  
**Last Updated:** December 15, 2025

