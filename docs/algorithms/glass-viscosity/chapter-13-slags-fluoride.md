# Chapter 13: Slag and Fluoride Melt Viscosity

**Part III: Extended Systems**

---

## Scope

This chapter covers viscosity calculation for **molten slags and fluoride-bearing melts** above the liquidus temperature. These systems are fundamentally different from silicate glasses:

- No glass transition — they are fully liquid above liquidus
- No VTF curve — there are no softening, annealing or strain points
- No fixed-point concept applies
- Physical state must be verified (above liquidus) before viscosity is meaningful
- Safety limits and "out of range" handling differ from the glass pipeline entirely

---

## Model Selection Logic (implementation notes)

The implemented service applies a conservative ordering to model selection so that compositions that are fluoride-dominant are rejected before any slag model is attempted. The rationale and routing are:

1. If the composition is `total fluorides > 20 wt%` AND `SiO₂ < 30 wt%` the composition is **fluoride-dominant** (ZBLAN-like), and **no published regression applicable** — return `NOT_SUPPORTED`.
2. Otherwise check for slag signatures (high CaO/low SiO₂, high FeO, or CaO+Al₂O₃ high with low SiO₂). If a slag is detected, choose between Iida and Nakamoto according to CaF₂ mole fraction.

```
Input composition
        │
        ▼
Total fluorides > 20 wt% AND SiO₂ < 30 wt%?
  └─ YES ──► NOT_SUPPORTED (fluoride-dominant; no reliable regression)
  └─ NO  ──► Slag detection? (CaO > 20 & SiO₂ < 50) OR (FeO > 10) OR (CaO+Al₂O₃ > 60 & SiO₂ < 45)
             ├─ YES ──► Compute CaF₂ (mole%) and route:
             │          • CaF₂ > 8 mol% → NAKAMOTO_2007 (preferred for high-fluoride slags)
             │          • CaF₂ ≥ 5 mol% → IIDA primary + NAKAMOTO_2007 available as secondary
             │          • CaF₂ < 5 mol% → IIDA primary (Nakamoto not applicable)
             └─ NO  ──► Not a slag — follow silicate glass path (Fluegel/Lakatos)
```

### Rationale and numeric thresholds

- `IIDA` (Iida & Guthrie 1988) is targeted at industrial CaO–SiO₂–Al₂O₃ slags. In our implementation we treat CaF₂ up to **8 mol%** (IIDA_MODEL.CaF2_max_mol = 0.08) as within Iida range.
- `NAKAMOTO_2007` is a fluoride-specialised slag model. Nakamoto is most appropriate when CaF₂ is substantial: we only consider Nakamoto as available when CaF₂ ≥ **5 mol%** (NAKAMOTO_2007.CaF2_min_mol = 0.05). When CaF₂ exceeds Iida's upper bound (≈8 mol%) Nakamoto is preferred.
- The `pure-fluoride` test is intentionally executed before slag detection so that fluoride-dominant melts (no SiO₂ backbone) are rejected regardless of the presence of CaO.

### Liquidus and safety

Before any slag viscosity calculation the liquidus temperature must be estimated (Mills/NPL). If the requested temperature is below the liquidus the result is `UNDEFINED — BELOW_LIQUIDUS` and no viscosity is returned. See the `MILLS_LIQUIDUS` coefficients and the implementation in `viscosity-parameters.ts` for details.

---

## Implementation notes (where to look in code)

- Slag detection & routing: `backend/src/modules/refractory/services/glass-viscosity.service.ts`
- Iida implementation: `backend/src/modules/refractory/utils/glass-viscosity-iida.util.ts` (planned / partial)
- Nakamoto implementation: `backend/src/modules/refractory/constants/viscosity-parameters.ts` (coefficients present) and `utils/glass-viscosity-nakamoto.util.ts` (planned)
- Liquidus estimation (Mills): `MILLS_LIQUIDUS` in `viscosity-parameters.ts`

---

## Known limitations

- Nakamoto and Iida cover slags above the liquidus only; they are not designed for glassy states.
- Fluoride volatilisation at T > ~1700°C can change composition in real furnaces; apply caution when using high-T predictions.

---

Return to: [Index](./INDEX.md)

---

## Liquidus Temperature Estimation (Mills / NPL)

Before any viscosity calculation the liquidus temperature **must** be estimated. If the slag is below its liquidus, viscosity is undefined (or at best "apparent" with solid fraction corrections).

### Formula

```
T_liq [°C] = 1225 + Σ (k_i · W_i)
```

Where `W_i` is the mass percentage of component i.

### Coefficients

| Component | k_i (°C / wt%) |
|-----------|---------------|
| SiO₂      | +1.85 |
| Al₂O₃     | +0.55 |
| TiO₂      | −1.10 |
| ZrO₂      | +2.40 |
| CaO       | −1.15 |
| MgO       | −2.20 |
| FeO       | −1.40 |
| MnO       | −1.25 |
| Na₂O      | −7.50 |
| K₂O       | −6.80 |
| Li₂O      | −12.40 |
| CaF₂      | −4.85 |
| B₂O₃      | −3.50 |

**Source:** Mills, K. C. (2011). *Estimating the Physical Properties of Slags.* SAIMM.

### Validity

- Optimised for CaO-SiO₂ based slags with Al₂O₃ ≤ 20% and CaF₂ ≤ 15%
- Typical error: ±50°C vs FactSage thermodynamic equilibrium
- If CaO/SiO₂ basicity ratio > 1.5, apply the dicalcium silicate correction:
  `T_liq += 0.1 · (B_ratio − 1.5) · 100`  where `B_ratio = W_CaO / W_SiO₂`
- Above 1600°C accuracy drops due to fluoride volatilisation

### Safety Zones

| Zone | Condition | Action |
|------|-----------|--------|
| Safe | T > T_liq + 50 K | Return model viscosity |
| Near-liquidus | T_liq < T ≤ T_liq + 50 K | Return viscosity with `NEAR_LIQUIDUS` warning |
| Below liquidus | T ≤ T_liq | Return `UNDEFINED — BELOW_LIQUIDUS`; do not calculate |

---

## Model A: Iida Viscosity Model

### Source

- Iida, T., & Guthrie, R. I. L. (1988). *The Physical Properties of Liquid Metals.* Oxford University Press.
- Mills, K. C. (2011). *Estimating the Physical Properties of Slags.* SAIMM.
- Allibert, M. & VDEh (1995). *Slag Atlas* (2nd Ed.). Verlag Stahleisen GmbH.

### Valid Range

- Temperature: 1300–1800°C
- Composition: industrial mixed slags (BF, BOF, LF), mould fluxes with CaF₂ ≤ 8% molar
- Not suitable for CaF₂ > 8 mol% — use Nakamoto in that case

### Formula

```
η = A · η₀ · exp(E / B_i*)
```

Where:
- `A = 1.031 × 10⁻³`  (converts to Pa·s)
- `η₀` = ideal (additive) viscosity of the mixture
- `B_i*` = Modified Basicity Index
- `E` = activation energy term (function of `B_i*`)

### Ideal Viscosity η₀

```
η₀ = Σ (η₀ᵢ · Xᵢ)
```

Where `Xᵢ` is the mole fraction and:

```
η₀ᵢ = 1.8×10⁻⁷ · √(Mᵢ · Tmᵢ) / Vmᵢ^(2/3) · exp(Hᵢ / RT)
```

**Pure component constants (verified from Slag Atlas / Iida & Guthrie 1988):**

| Oxide | Mᵢ (g/mol) | Tmᵢ (K) | Vmᵢ (×10⁻⁶ m³/mol) | Hᵢ (J/mol) |
|-------|-----------|---------|---------------------|------------|
| SiO₂  | 60.08  | 1996 | 27.2 | 51100 |
| Al₂O₃ | 101.96 | 2327 | 28.3 | 47800 |
| CaO   | 56.08  | 2886 | 16.5 | 33900 |
| MgO   | 40.30  | 3105 | 11.5 | 32200 |
| FeO   | 71.85  | 1644 | 14.5 | 24300 |
| MnO   | 70.94  | 2115 | 15.6 | 30500 |
| CaF₂  | 78.08  | 1691 | 24.5 | 29700 |
| Na₂O  | 61.98  | 1405 | 27.3 | 19500 |
| Li₂O  | 29.88  | 1711 | 13.9 | 25000 |

### Basicity Index B_i* (Modified)

**Step 1 — Simple Basicity Index:**
```
B_i = Σ(α_basic · W_i) / Σ(α_acid · W_j)
```

**Step 2 — Dynamic Al₂O₃ coefficient:**
```
α_Al₂O₃ = 0.13 · B_i² − 0.38 · B_i + 0.53
```

**Step 3 — Modified Basicity Index:**
```
B_i* = Σ(α_basic · W_i) / [Σ(α_acid · W_j) + α_Al₂O₃ · W_Al₂O₃]
```

**Interaction coefficients α:**

| Component | α | Type |
|-----------|---|------|
| SiO₂  | 1.00 | Acid (reference) |
| TiO₂  | 0.65 | Acid |
| ZrO₂  | 0.40 | Acid |
| CaO   | 1.53 | Basic |
| MgO   | 1.51 | Basic |
| K₂O   | 1.94 | Basic |
| Na₂O  | 1.94 | Basic |
| Li₂O  | 2.15 | Basic |
| FeO   | 1.00 | Basic |
| MnO   | 1.00 | Basic |
| CaF₂  | 1.20 | Basic |
| Al₂O₃ | dynamic | Amphoteric |

### Activation Energy E

```
E = 10.29 / (B_i* + 0.31)² + 1.13
```

---

## Model B: Nakamoto Viscosity Model (2007)

### Source

- Nakamoto, H., Kiyose, A., & Tanaka, T. (2007). "A model for estimating the viscosity of multi-component slags containing alkali oxide and calcium fluoride." *ISIJ International*, 47(11), 1583–1590.
- Tanaka, T., et al. (2004). "Evaluation of Viscosity of Molten Slag with the Concept of Optical Basicity." *Steel Research International*, 75, 238–243.

### Valid Range

- Temperature: 1200–1900°C
- Best for: CaF₂ > 5% (mould fluxes, ESR slags, high-fluoride refining slags)
- Upper caution: above 1700°C fluoride volatilisation may change composition in practice

### Formula

```
η = A · T · exp(E / RT)
```

Where:
- `T` = temperature in Kelvin
- `R = 8.314 J/(mol·K)`
- `E = Σ (eᵢ · Xᵢ)` — activation energy (J/mol)
- `ln(A) = −20.5 + 0.025 · M_avg` — composition-dependent pre-exponential
- `M_avg = Σ (Xᵢ · Mᵢ)` — average molar mass of mixture

### Activation Energy Coefficients eᵢ (J/mol)

**Source: Nakamoto et al. (2007) Table "Parameters eᵢ for activation energy", ISIJ Int. 47(11).**

| Component | eᵢ (J/mol) | Structural Role |
|-----------|-----------|----------------|
| SiO₂      | +154 500 | Primary network former |
| P₂O₅      | +132 000 | Strong network former |
| Al₂O₃     | +118 400 | Amphoteric (network builder in basic slags) |
| ZrO₂      | +92 600  | Weak network former |
| TiO₂      | +84 100  | Weak network former |
| B₂O₃      | +68 300  | Network former (low coordination) |
| Fe₂O₃     | +52 000  | Amphoteric |
| FeO       | −34 200  | Network modifier |
| MnO       | −38 600  | Network modifier |
| MgO       | −45 300  | Network modifier |
| CaO       | −56 200  | Network modifier |
| Na₂O      | −75 400  | Strong modifier |
| K₂O       | −88 100  | Very strong modifier |
| Li₂O      | −94 500  | Maximum oxide modifier |
| CaF₂      | −108 200 | Chain terminator (maximum depolymeriser) |

**Note on CaF₂ coefficient:** The value −108 200 J/mol is the 2007 revision; earlier Nakamoto (2004) used −72 800. The 2007 value is the current standard for continuous casting system calculations.

**Note on Fe oxides:** The Fe₂O₃ coefficient (+52 000) is valid under oxidising conditions only. In reducing environments iron exists primarily as FeO, use FeO coefficient instead.

---

## Alumina Special Handling in High-Acid Slags (Nakamoto)

In highly acidic slags (SiO₂ > 55 mol%), Al₂O₃ behaves more like a network modifier. In this case reduce the Nakamoto eᵢ for Al₂O₃ by 15%:

```
If X_SiO₂ > 0.55 (molar):  e_Al₂O₃_effective = 118400 × 0.85 = 100640 J/mol
```

---

## Operational Constraints and Safety Limits for Slags

**These constraints are fundamentally different from the glass pipeline.**

### Temperature Boundaries

| Limit | Condition | Result |
|-------|-----------|--------|
| Below liquidus | T ≤ T_liq | `UNDEFINED` — do not calculate |
| Near liquidus | T_liq < T ≤ T_liq + 50 K | Calculate + `NEAR_LIQUIDUS` warning |
| Iida max | T > 1800°C | `OUT_OF_RANGE` warning (Iida) |
| Nakamoto max | T > 1900°C | `OUT_OF_RANGE` warning (Nakamoto) |
| Fluoride volatilisation | T > 1700°C with CaF₂ present | `FLUORIDE_VOLATILISATION` warning |

### Inverse Calculation (Temperature from Target Viscosity)

For slags there is **no closed-form inverse**. Numerical bisection is used on [T_liq + 50, T_max].

- If target viscosity > η(T_liq + 50 K): result is `UNDEFINED` — slag would be too viscous (near solidification)
- If target viscosity < η(T_max): result is `UNDEFINED` — outside model physics
- In both cases do NOT extrapolate; return an explicit out-of-range error

### No Extrapolation Policy

> Viscosity calculations for slags must not be performed outside the temperature and composition ranges stated above. Linear or polynomial approximation beyond these bounds is prohibited.

---

## Output Structure for Slag Calculations

```typescript
interface SlagViscosityResult {
  viscosity_Pas: number;
  logViscosity_Pas: number;
  temperature_C: number;
  liquidusTemperature_C: number;
  thermalState: 'ABOVE_LIQUIDUS' | 'NEAR_LIQUIDUS' | 'BELOW_LIQUIDUS';
  model: 'IIDA' | 'NAKAMOTO_2007';
  modelRef: string;
  warnings: string[];
  // Iida-specific
  B_i_simple?: number;
  B_i_star?: number;
  E_activation?: number;
  // Nakamoto-specific
  E_total_J_mol?: number;
  lnA?: number;
  M_avg?: number;
}
```

---

## Comparison: Iida vs Nakamoto

| Feature | Iida Model | Nakamoto 2007 |
|---------|-----------|--------------|
| Primary logic | Modified Basicity Index (B_i*) | Molar bond strength (eᵢ) |
| CaF₂ treatment | Strong basic modifier (α = 1.20) | Chain terminator (e = −108 200) |
| Best CaF₂ range | 0–8 mol% | 5–25 mol% |
| Al₂O₃ treatment | Dynamic α based on basicity | Constant eᵢ (with acid-correction) |
| Temperature range | 1300–1800°C | 1200–1900°C |
| Near-liquidus accuracy | Moderate | High (for CaF₂ systems) |
| High-temp stability | Excellent | Good (watch fluoride volatilisation) |
| Accuracy vs Riboud/Urbain | Superior for Al₂O₃ > 15% or CaF₂ > 5% | Superior for fluoride melts |

---

**Next:** [Chapter 14 — Implementation State](./chapter-14-implementation-state.md)

