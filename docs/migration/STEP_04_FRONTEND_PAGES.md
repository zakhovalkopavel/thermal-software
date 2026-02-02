# STEP 04: Frontend Pages Migration

**Priority:** HIGH  
**Complexity:** MEDIUM  
**Estimated Time:** 1-2 weeks  
**Dependencies:** Backend API endpoints complete

---

## Overview

Migrate legacy HTML/CSS/JS frontend to modern React + Material-UI.

**Legacy Location:** `legacy/refractory/public/`  
**Target Location:** `frontend/src/pages/`

---

## Page Structure

```
frontend/src/
├── pages/
│   ├── refractory/
│   │   ├── PhaseCalculator/
│   │   │   ├── index.tsx
│   │   │   ├── PhaseCalculatorForm.tsx
│   │   │   ├── ResultsDisplay.tsx
│   │   │   ├── CompositionInput.tsx
│   │   │   └── styles.module.css
│   │   ├── BlendOptimizer/
│   │   │   ├── index.tsx
│   │   │   ├── OptimizerForm.tsx
│   │   │   ├── FractionInput.tsx
│   │   │   ├── OptionsPanel.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   ├── PSDChart.tsx
│   │   │   └── styles.module.css
│   │   ├── MixLibrary/
│   │   │   ├── index.tsx
│   │   │   ├── LibraryBrowser.tsx
│   │   │   ├── PresetCard.tsx
│   │   │   ├── SaveDialog.tsx
│   │   │   └── styles.module.css
│   │   └── MaterialLibrary/
│   │       ├── index.tsx
│   │       ├── MaterialList.tsx
│   │       ├── MaterialForm.tsx
│   │       └── styles.module.css
│   ├── furnace/
│   │   └── CombustionCalculator/
│   │       ├── index.tsx
│   │       ├── FuelInput.tsx
│   │       ├── ResultsDisplay.tsx
│   │       └── styles.module.css
│   └── Home.tsx
├── components/
│   ├── common/
│   │   ├── OxideCompositionInput.tsx
│   │   ├── TemperatureInput.tsx
│   │   ├── ResultCard.tsx
│   │   └── LoadingSpinner.tsx
│   └── charts/
│       ├── PSDChart.tsx
│       ├── PhaseChart.tsx
│       └── EfficiencyChart.tsx
├── services/
│   ├── api/
│   │   ├── refractory.api.ts
│   │   ├── furnace.api.ts
│   │   └── material.api.ts
│   └── hooks/
│       ├── usePhaseCalculation.ts
│       ├── useBlendOptimization.ts
│       └── useMaterials.ts
└── types/
    ├── refractory.types.ts
    └── furnace.types.ts
```

---

## Page Migrations

### 1. Phase Equilibrium Calculator

**Legacy:** `legacy/refractory/public/phase-calculator.html`  
**Target:** `frontend/src/pages/refractory/PhaseCalculator/`

**Components:**
- `PhaseCalculatorForm.tsx` - Input form
- `CompositionInput.tsx` - Oxide composition inputs
- `ResultsDisplay.tsx` - Results visualization
- `PhaseChart.tsx` - Liquid/solid distribution chart

**Features:**
- Form validation
- Real-time calculation
- Results export
- History tracking

---

### 2. Blend Optimizer

**Legacy:** `legacy/refractory/public/blend-optimizer.html`  
**Target:** `frontend/src/pages/refractory/BlendOptimizer/`

**Components:**
- `OptimizerForm.tsx` - Main form
- `FractionInput.tsx` - Fraction input rows
- `OptionsPanel.tsx` - Optimization options (q values, methods)
- `ResultsTable.tsx` - Results table with sorting/filtering
- `PSDChart.tsx` - Particle size distribution chart

**Features:**
- Dynamic fraction rows (add/remove)
- Multiple optimization scenarios
- Results comparison
- Export to CSV/JSON

---

### 3. Mix Library Browser

**Legacy:** `legacy/refractory/public/mix-library.html`  
**Target:** `frontend/src/pages/refractory/MixLibrary/`

**Components:**
- `LibraryBrowser.tsx` - Main browser
- `PresetCard.tsx` - Mix preset cards
- `SaveDialog.tsx` - Save/edit dialog
- `ImportExport.tsx` - Import/export functionality

**Features:**
- Search/filter presets
- Save custom mixes
- Load into calculators
- Share/export presets

---

### 4. Material Library

**Target:** `frontend/src/pages/refractory/MaterialLibrary/`

**Components:**
- `MaterialList.tsx` - Material list with search
- `MaterialForm.tsx` - Add/edit material
- `MaterialCard.tsx` - Material details card

**Features:**
- CRUD operations
- Search by name/type
- Filter by properties
- Bulk import

---

### 5. Furnace Combustion Calculator

**Target:** `frontend/src/pages/furnace/CombustionCalculator/`

**Components:**
- `FuelInput.tsx` - Fuel composition input
- `ProcessParameters.tsx` - Process parameters
- `ResultsDisplay.tsx` - Combustion results
- `EfficiencyChart.tsx` - Efficiency visualization

---

## API Integration

### API Service Layer

```typescript
// services/api/refractory.api.ts
export const refractoryApi = {
  calculatePhaseEquilibrium: async (data: PhaseCalculationInput) => {
    const response = await axios.post('/api/v1/refractory/phase-equilibrium', data);
    return response.data;
  },

  optimizeBlend: async (data: BlendOptimizationInput) => {
    const response = await axios.post('/api/v1/refractory/blend-optimization', data);
    return response.data;
  },

  // ...
};
```

---

### Custom Hooks

```typescript
// services/hooks/usePhaseCalculation.ts
export const usePhaseCalculation = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const calculate = async (data: PhaseCalculationInput) => {
    setLoading(true);
    try {
      const result = await refractoryApi.calculatePhaseEquilibrium(data);
      setResult(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, error, calculate };
};
```

---

## Implementation Steps

### Step 1: Common Components (8 hours)
- [ ] Create OxideCompositionInput
- [ ] Create TemperatureInput
- [ ] Create ResultCard
- [ ] Create LoadingSpinner
- [ ] Create form validation utilities

### Step 2: API Service Layer (4 hours)
- [ ] Create API service files
- [ ] Create custom hooks
- [ ] Add error handling
- [ ] Add request/response interceptors

### Step 3: Phase Calculator Page (8 hours)
- [ ] Create page structure
- [ ] Implement form
- [ ] Implement results display
- [ ] Add charts
- [ ] Add export functionality

### Step 4: Blend Optimizer Page (12 hours)
- [ ] Create page structure
- [ ] Implement dynamic fraction inputs
- [ ] Implement options panel
- [ ] Implement results table
- [ ] Add PSD chart
- [ ] Add comparison features

### Step 5: Mix Library Page (8 hours)
- [ ] Create browser interface
- [ ] Implement search/filter
- [ ] Implement save/load
- [ ] Add import/export

### Step 6: Material Library Page (8 hours)
- [ ] Create list view
- [ ] Implement CRUD operations
- [ ] Add search/filter
- [ ] Add bulk import

### Step 7: Furnace Calculator Page (8 hours)
- [ ] Create page structure
- [ ] Implement fuel input
- [ ] Implement results display
- [ ] Add charts

### Step 8: Integration & Testing (8 hours)
- [ ] Connect to backend APIs
- [ ] Test all workflows
- [ ] Fix bugs
- [ ] Add loading states
- [ ] Add error handling

**Total:** 64 hours (1.5-2 weeks)

---

## UI/UX Improvements

### Modern Features to Add:
- Real-time validation
- Auto-save drafts
- Keyboard shortcuts
- Dark mode support
- Responsive design
- Print-friendly layouts
- Export to PDF
- History/undo functionality

---

**Next:** [STEP_05_DATABASE_MIGRATION.md](STEP_05_DATABASE_MIGRATION.md)

