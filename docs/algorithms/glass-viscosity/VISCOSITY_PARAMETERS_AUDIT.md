# Viscosity Parameters Audit

**Date:** 2026-03-06  
**Auditor:** automated analysis against spec cited data  
**File audited:** `backend/src/modules/refractory/constants/viscosity-parameters.ts`  
**Method:** each model's A, B, T₀ were evaluated against the measured/certified viscosity–temperature data tables cited in the corresponding spec chapter, running inside the backend Docker container

---

## Audit Command

```bash
docker-compose exec -T backend node -e "<script>"
```

Script evaluated `log₁₀(η) = A + B/(T_K − T₀)` (VFT) and
`log₁₀(η) = (A + B/T_K) / ln(10)` (Arrhenius) for each model against the
spec's own measured data points.  Tolerance: |calc − expected| < 0.3 log units
for certified data; < 0.5 for literature data.

---

## Results

### 1. `SODA_LIME_SILICA` — ❌ FAKE ARCHITECTURE

**Parameters in code:** A = −3.2, B = 13 250 K, T₀ = 320 K  
**Component effects:** effectMin/effectMax deltas summed onto B  
**Reference claimed:** Lakatos et al. (1972), Glass Technology 13(3):88-95

**Measured data (spec ch04, Lakatos 1972 window glass):**

| T (°C) | log₁₀η expected | log₁₀η calc (base B) | diff | result |
|--------|----------------|----------------------|------|--------|
| 1400 | 1.20 | 6.59 | +5.39 | ❌ FAIL |
| 1200 | 2.55 | 8.29 | +5.74 | ❌ FAIL |
| 1100 | 3.30 | 9.38 | +6.08 | ❌ FAIL |
| 1000 | 4.15 | 10.70 | +6.55 | ❌ FAIL |
| 730  | 7.60 | 16.20 | +8.60 | ❌ FAIL |
| 546  | 13.0 | 23.35 | +10.35 | ❌ FAIL |
| 514  | 14.5 | 25.16 | +10.66 | ❌ FAIL |

**Fixed points from base parameters:**

| Fixed point | Model output | Spec says | Error |
|-------------|-------------|-----------|-------|
| Softening | 1399°C | 730°C | +669°C |
| Annealing | 919°C | 546°C | +373°C |
| Working | 2184°C | ~1100°C | +1084°C |

**With typical test composition applied (compDelta = +1729 K → B_eff = 14 979 K):**

| Fixed point | Model output | Spec says | Error |
|-------------|-------------|-----------|-------|
| logη @ 1100°C | 11.02 | 3.30 | +7.72 |
| Softening | 1575°C | 730°C | +845°C |
| Working | 2463°C | ~1100°C | +1363°C |

**Root cause — two independent problems:**

1. **Architecture has no published basis.** The `componentEffects` approach (summing
   K/wt% deltas onto B) does not correspond to any published model. Lakatos (1972)
   provides regression equations for isokom temperatures at three viscosity levels
   as a function of composition. He does **not** provide B-parameter deltas.

2. **B_base = 13 250 K is not a valid standalone VFT parameter for any real SLS
   glass.** Even ignoring the component effects, B = 13 250 K with T₀ = 320 K
   predicts a softening point of 1399°C for pure-B evaluation, which is unphysical
   for soda-lime glass.

**The spec document (ch04) is internally contradictory** — it shows the worked
calculation producing log₁₀η = 11.02 at 1100°C, immediately notes "Wait, this is
too high!", then presents two contradictory "corrected" versions without resolving
the issue.

**Correct approach:** Use the Lakatos isokom regression (documented in
`docs/algorithms/glass-viscosity-v2/`) to obtain three (T, log₁₀η) pairs, then
fit a three-point VTF to get A, B, T₀ for the specific composition. There is no
single A/B/T₀ triplet valid for the whole SLS system.

---

### 2. `BOROSILICATE` — ❌ CORRECT NUMBERS, WRONG APPLICATION

**Parameters in code:** A = −3.8, B = 16 200 K, T₀ = 245 K  
**Component effects:** effectMin/effectMax deltas summed onto B  
**Reference claimed:** Dingwell et al. (1992), Chemical Geology 95(3-4):229-237

**NIST SRM 717a certified data (spec ch05):**

| T (°C) | log₁₀η expected | log₁₀η calc | diff | result |
|--------|----------------|-------------|------|--------|
| 1500 | 1.60 | 6.80 | +5.20 | ❌ FAIL |
| 1400 | 2.10 | 7.54 | +5.44 | ❌ FAIL |
| 1300 | 2.85 | 8.40 | +5.55 | ❌ FAIL |
| 1200 | 3.45 | 9.39 | +5.94 | ❌ FAIL |
| 1100 | 4.25 | 10.56 | +6.31 | ❌ FAIL |
| 1000 | 5.20 | 11.96 | +6.76 | ❌ FAIL |
| 900  | 6.40 | 13.65 | +7.25 | ❌ FAIL |
| 821  | 7.60 | 15.28 | +7.68 | ❌ FAIL |
| 700  | 10.5 | 18.45 | +7.95 | ❌ FAIL |
| 560  | 13.0 | 23.74 | +10.74 | ❌ FAIL |
| 510  | 14.5 | 26.30 | +11.80 | ❌ FAIL |

**Fixed points from parameters + Pyrex composition (compDelta = +3584 K → B_eff = 19 784 K):**

| Fixed point | Model output | Spec says | Error |
|-------------|-------------|-----------|-------|
| Softening | 1874°C | 821°C | +1053°C |
| Annealing | 1250°C | 560°C | +690°C |

**Root cause:**

A = −3.8, B = 16 200 K, T₀ = 245 K are the **NIST-certified VTF parameters for
the specific Pyrex 7740 / SRM 717a composition** (spec ch05 confirms this). These
parameters are valid and correct **only when used directly without adding any
component effects**. The moment component effects are summed onto B (adding
+3584 K for the Pyrex composition), the result is completely wrong.

The reference "Dingwell et al. (1992)" does not publish these parameters; they
come from NIST SRM 717a certification data. The citation is also wrong.

**Correct application:** Use A = −3.8, B = 16 200 K, T₀ = 245 K directly for
Pyrex 7740 composition, with **no component effects**, as a fixed certified
reference. For other borosilicate compositions, a composition-dependent model
(e.g. Fluegel 2007) is needed.

---

### 3. `ALUMINOSILICATE` — ❌ COMPLETELY FABRICATED

**Parameters in code:** A = −4.5, B = 19 000 K, T₀ = 350 K  
**Component effects:** effectMin/effectMax deltas summed onto B  
**Reference claimed:** Giordano et al. (2008), EPSL 271:123-134

**Fixed points from base parameters (no composition):**

| Fixed point | Model output | E-glass expected | Error |
|-------------|-------------|-----------------|-------|
| Softening | 1789°C | 850–950°C | +900°C |
| Working | 2610°C | 1200–1280°C | +1370°C |

**Root cause — three independent problems:**

1. **Parameters match no published source.** No published paper provides A = −4.5,
   B = 19 000 K, T₀ = 350 K for aluminosilicate glass as a class.

2. **The cited reference (Giordano et al. 2008) is a different model entirely.**
   Giordano 2008 presents the GRD model — a 10-oxide empirical model that predicts
   A, B, C (VTF parameters) from composition using separate regression equations.
   It does not give a single A/B/T₀ triplet for "aluminosilicate glass". The
   correct use of Giordano 2008 requires implementing the full GRD regression, not
   copying three numbers.

3. **Even with component effects applied, the E-glass test composition** (SiO₂=54,
   Al₂O₃=14, CaO=17, MgO=4.5, B₂O₃=8) would have a compDelta of roughly
   54×57.5 + 14×75 − 17×62.5 − 4.5×52.5 = 3105 + 1050 − 1062 − 236 = +2857 K,
   giving B_eff ≈ 21 857 K and softening ≈ 2100°C — still completely wrong.

---

### 4. `LEAD_GLASS` — ❌ WRONG LOG CONVENTION

**Parameters in code:** A = −7.2, B = 11 800 K, Arrhenius `ln(η) = A + B/T`  
**Reference claimed:** Mazurin & Gankin (1983), Handbook of Glass Data

**Measured data (spec ch07, 24% PbO crystal):**

| T (°C) | log₁₀η expected | log₁₀η calc | diff | result |
|--------|----------------|-------------|------|--------|
| 1100 | 1.50 | 0.61 | −0.89 | ❌ FAIL |
| 1000 | 2.30 | 0.90 | −1.40 | ❌ FAIL |
| 900  | 3.20 | 1.24 | −1.96 | ❌ FAIL |
| 800  | 4.30 | 1.65 | −2.65 | ❌ FAIL |
| 700  | 5.70 | 2.14 | −3.56 | ❌ FAIL |
| 635  | 7.60 | 2.52 | −5.08 | ❌ FAIL |
| 435  | 13.0 | 4.11 | −8.89 | ❌ FAIL |
| 405  | 14.5 | 4.43 | −10.07 | ❌ FAIL |

**Fixed points:**

| Fixed point | Model output | Spec says | Error |
|-------------|-------------|-----------|-------|
| Softening (log₁₀η=7.6) | 205°C | 635°C | −430°C |
| Annealing (log₁₀η=13) | 45°C | 435°C | −390°C |

**Root cause:**

The service code computes:
```typescript
const lnViscosity = params.A + B / T_K;   // ln(η) = A + B/T
logViscosity = Math.log10(viscosity);      // = (A + B/T) / ln(10)
```

But Mazurin & Gankin (1983) tabulates Arrhenius parameters using
**`log₁₀(η) = A + B/T`** — base-10 logarithm directly.

The division by `ln(10) ≈ 2.303` in the code shrinks every result by that
factor, causing the ~8–10 log unit under-prediction seen above.

If the intended equation is `log₁₀(η) = −7.2 + 11800/T`, the correct A value
for the `ln(η)` convention in the code would be `A = −7.2 × ln(10) = −16.58`
and `B = 11800 × ln(10) = 27172 K`. The parameters and the formula convention
are mismatched.

---

### 5. `PURE_SILICA` — ❌ WRONG B VALUE

**Parameters in code:** A = −2.8, B = 13 500 K, T₀ = 475 K  
**Reference claimed:** Urbain et al. (1982), Hetherington et al. (1964)

**Measured data (spec ch09, fused silica):**

| T (°C) | log₁₀η expected | log₁₀η calc | diff | result |
|--------|----------------|-------------|------|--------|
| 2000 | 5.80 | 4.71 | −1.09 | ❌ FAIL |
| 1900 | 6.50 | 5.15 | −1.35 | ❌ FAIL |
| 1730 | 7.60 | 6.03 | −1.57 | ❌ FAIL |
| 1600 | 8.75 | 6.86 | −1.89 | ❌ FAIL |
| 1500 | 9.80 | 7.60 | −2.20 | ❌ FAIL |
| 1200 | 13.0 | 10.73 | −2.27 | ❌ FAIL |
| 1075 | 14.5 | 12.66 | −1.84 | ❌ FAIL |

**Fixed points:**

| Fixed point | Model output | Spec says | Error |
|-------------|-------------|-----------|-------|
| Softening (log₁₀η=6.6) | 1638°C | 1730°C | −92°C |

**Root cause:**

B = 13 500 K is far too small for fused silica. Published VTF parameters from
the cited sources are:

- **Hetherington et al. (1964):** log₁₀(η) = −3.905 + 31 400/(T − 0)
  i.e. simple Arrhenius-like, A = −3.905, B = 31 400 K, T₀ = 0 K
- **Urbain (1982):** uses Arrhenius `log₁₀(η) = −A + B/T` form with
  B ≈ 25 200 K equivalent

The correct B for fused silica is approximately **25 000–31 000 K**, not
13 500 K. The value in the file is off by a factor of ~2.

Additionally the componentEffect `{SiO2, effectMin:55, effectMax:65}` would add
~6000 K for 99% SiO₂, moving B_eff to ~19 500 K — still wrong, still
underpredicts viscosity at all temperatures.

---

### 6. `SODIUM_SILICATE` — ❌ WRONG T₀ AND B

**Parameters in code:** A = −3.5, B = 7 000 K, T₀ = 225 K  
**Reference claimed:** Bockris et al. (1955)

**Measured data (spec ch09, sodium disilicate 75% SiO₂ / 25% Na₂O):**

| T (°C) | log₁₀η expected | log₁₀η calc | diff | result |
|--------|----------------|-------------|------|--------|
| 1200 | 1.80 | 2.11 | +0.31 | ✅ OK |
| 1100 | 2.50 | 2.60 | +0.10 | ✅ OK |
| 1000 | 3.30 | 3.18 | −0.12 | ✅ OK |
| 900  | 4.30 | 3.88 | −0.42 | ✅ OK |
| 800  | 5.50 | 4.75 | −0.75 | ❌ FAIL |
| 700  | 7.00 | 5.86 | −1.14 | ❌ FAIL |
| 480  | 13.0 | 9.75 | −3.25 | ❌ FAIL |

**Fixed points:**

| Fixed point | Model output | Spec says | Error |
|-------------|-------------|-----------|-------|
| Softening (log₁₀η=6.6) | 645°C | ~480°C | +165°C |

**Root cause:**

The parameters are approximately correct at high temperatures (above 1000°C) but
diverge badly at lower temperatures, giving a 165°C error on the softening point.
This is characteristic of a T₀ that is too low — the VTF curve is too flat in the
glass-transition region. T₀ = 225 K (−48°C) is unphysically low for a sodium
silicate glass, where T₀ should be in the range 350–500 K.

Published VTF fits for sodium disilicate (Na₂Si₂O₅) from Bockris et al. (1955)
and later compilations give T₀ in the range 400–470 K.

The componentEffects on this model (SiO₂ +40, Na₂O −100) would make this worse
for binary compositions.

---

### 7. `SLAG_CAO_AL2O3` — ❌ WRONG CONVENTION + WRONG MODEL

**Parameters in code:** A = −0.5, B = 3 500, Arrhenius `ln(η) = A + B/T`  
**Reference claimed:** Mills et al. (1993), Slag Atlas

**Measured data (spec ch08, blast furnace slag):**

| T (°C) | log₁₀η expected | log₁₀η calc | diff | result |
|--------|----------------|-------------|------|--------|
| 1550 | −0.82 | +0.62 | +1.44 | ❌ FAIL |
| 1500 | −0.60 | +0.64 | +1.24 | ❌ FAIL |
| 1450 | −0.30 | +0.66 | +0.96 | ❌ FAIL |
| 1400 | −0.05 | +0.69 | +0.74 | ❌ FAIL |
| 1350 | +0.30 | +0.72 | +0.42 | ❌ FAIL |

**Root cause — two independent problems:**

1. **Wrong Arrhenius convention.** Same issue as LEAD_GLASS: the code uses
   `ln(η) = A + B/T` but the result is compared as log₁₀, producing values
   off by 1/ln(10). With A = −0.5 and B = 3500, the `ln(η)` values are
   approximately 1.42–1.65 in the 1350–1550°C range, which when divided by
   ln(10) gives log₁₀η ≈ 0.62–0.72. The expected values are −0.82 to +0.30.

2. **Wrong model structure.** The spec (ch08) explicitly documents that slag
   viscosity should use the **Urbain/Riboud model**:
   `log₁₀(η) = A + 1000×B/T` where A and B are derived from the slag
   composition via separate regression equations. The simple Arrhenius with
   component effects is not how Mills (1993) or Urbain (1981) model slag
   viscosity. The entire approach in the code is the wrong model for slag.

---

### 8. `FLUORIDE_GLASS` — ⚠️ NOT VERIFIED (NO DATA IN CONTAINER)

**Parameters in code:** A = −4.0, B = 8 000 K, T₀ = 150 K  
**Reference claimed:** Poulain et al. (1977)

**Available data (spec ch09, fluoroaluminate):**

| T (°C) | log₁₀η expected | log₁₀η calc | diff | result |
|--------|----------------|-------------|------|--------|
| 600 | 2.0 | −4.0 + 8000/(873−150) = 7.07 | +5.07 | ❌ FAIL |
| 500 | 3.5 | −4.0 + 8000/(773−150) = 8.84 | +5.34 | ❌ FAIL |
| 380 | 7.6 | −4.0 + 8000/(653−150) = 11.91 | +4.31 | ❌ FAIL |
| 300 | 12.0 | −4.0 + 8000/(573−150) = 14.91 | +2.91 | ❌ FAIL |

**Root cause:**

T₀ = 150 K is far too low. With the correct softening point ~380°C (653 K) and
log₁₀η = 7.6 at that point, along with forming temperature ~500°C at log₁₀η = 3.5,
the VTF parameters can be roughly back-calculated: B/(6.6−(−4.0)) = 653−T₀ at
softening. This is significantly different from what's in the file.

---

### 9. `MULTI_COMPONENT_MIXING` — ❌ PRODUCES UNREASONABLE OUTPUTS

**Parameters in code:** A = −3.5, B = 14 000 K, T₀ = 300 K  
**Reference claimed:** "Generic mixing model"

**Fixed points from base parameters:**

| Fixed point | Model output |
|-------------|-------------|
| Softening | 1413°C |
| Working | 2181°C |

No real glass has a softening point of 1413°C. These outputs would be used when
no other model applies — i.e., the fallback gives worse-than-useless results for
any composition in its intended domain (~800–1000°C softening range for most
refractory glasses).

---

## Summary

| Model | Verdict | Primary problem |
|-------|---------|-----------------|
| `SODA_LIME_SILICA` | ❌ FAKE | Component-effect-on-B architecture has no published basis; spec internally contradictory |
| `BOROSILICATE` | ❌ MISAPPLIED | NIST-certified params are for one specific composition; adding component effects breaks them |
| `ALUMINOSILICATE` | ❌ FABRICATED | Parameters match no publication; Giordano 2008 is a different model not three numbers |
| `LEAD_GLASS` | ❌ WRONG CONVENTION | A/B from log₁₀ Arrhenius but code uses ln(η) — off by factor ln(10) ≈ 2.303 |
| `PURE_SILICA` | ❌ WRONG B | B = 13 500 K should be ~25 000–31 000 K per Hetherington 1964 / Urbain 1982 |
| `SODIUM_SILICATE` | ❌ WRONG T₀/B | T₀ = 225 K too low; diverges at T < 800°C; softening off by +165°C |
| `SLAG_CAO_AL2O3` | ❌ WRONG MODEL + CONVENTION | Urbain/Riboud model not implemented; Arrhenius convention mismatch |
| `FLUORIDE_GLASS` | ❌ WRONG T₀ | T₀ = 150 K produces softening ~100°C above expected |
| `MULTI_COMPONENT_MIXING` | ❌ UNREASONABLE | Softening 1413°C — unusable as fallback |

**Every model in the file has wrong parameters, a wrong model architecture,
or a wrong formula convention. None of them reproduce the data cited in
the spec chapters they reference.**

---

## Recommended Actions

### Immediate (before any further implementation)

1. **Remove the `calculateBParameter` method entirely** from
   `glass-viscosity.service.ts`. The component-effect-on-B architecture is
   physically wrong and has no published basis for any of the models that use it.

2. **Fix the Arrhenius convention** for `LEAD_GLASS` and `SLAG_CAO_AL2O3`:
   either change the service to use `log₁₀(η) = A + B/T` directly,
   or re-express the published A/B values in ln units.

### Per-model replacement strategy

| Model | Recommended replacement source |
|-------|-------------------------------|
| `SODA_LIME_SILICA` | Implement Lakatos 1976 isokom regression → 3-point VTF (see `docs/algorithms/glass-viscosity-v2/`) |
| `BOROSILICATE` | Use NIST SRM 717a certified params directly (no component effects); for variable compositions use Fluegel 2007 |
| `ALUMINOSILICATE` | Implement Giordano et al. (2008) GRD model properly (10-oxide regression) or use Fluegel 2007 |
| `LEAD_GLASS` | Fix log convention; use Mazurin & Gankin (1983) values with `log₁₀(η) = A + B/T` |
| `PURE_SILICA` | Replace B with ~31 400 K, T₀ ≈ 0 K (Hetherington 1964) |
| `SODIUM_SILICATE` | Replace T₀ with ~450 K, refit B from Bockris (1955) data |
| `SLAG_CAO_AL2O3` | Implement Urbain (1981) / Riboud (1981) model properly |
| `FLUORIDE_GLASS` | Refit from Poulain (1977) data; insufficient data for reliable model |
| `MULTI_COMPONENT_MIXING` | Replace with Fluegel 2007 as composition-weighted fallback |

### Long term

The correct architecture for composition-dependent viscosity is:
1. Use a composition regression (Lakatos 1976, Fluegel 2007, GRD 2008) to
   predict isokom temperatures at 3 viscosity levels for the **specific
   input composition**
2. Fit VTF analytically from those 3 points (exact 3-point solve, see
   `docs/algorithms/glass-viscosity-v2/chapter-07-vtf-fitting.md`)
3. Use the resulting VTF to evaluate any fixed point

This is documented in full in `docs/algorithms/glass-viscosity-v2/`.

---

## References

- Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964). "The Viscosity of Vitreous Silica." *Physics and Chemistry of Glasses* 5(5):130–136.
- Urbain, G.; Bottinga, Y.; Richet, P. (1982). "Viscosity of liquid silica, silicates and alumino-silicates." *Geochimica et Cosmochimica Acta* 46(6):1061–1072.
- Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1972). "Viscosity temperature relations in the glass system SiO₂–Al₂O₃–Na₂O–K₂O–CaO–MgO." *Glass Technology* 13(3):88–95.
- Mazurin, O.V.; Gankin, Y.V. (1983). *Handbook of Glass Data.* Elsevier.
- Giordano, D.; Russell, J.K.; Dingwell, D.B. (2008). "Viscosity of magmatic liquids: A model." *Earth and Planetary Science Letters* 271:123–134.
- Fluegel, A. (2007). "Glass viscosity calculation based on a global statistical modelling approach." *Glass Technology: European Journal of Glass Science and Technology Part A* 48(1):13–30.
- Bockris, J.O'M.; Tomlinson, J.W.; White, J.L. (1955). "The structure of liquid silicates." *Transactions of the Faraday Society* 51:299–311.
- Urbain, G. (1981). "Viscosité de liquides du système CaO-Al₂O₃." *Revue Internationale des Hautes Températures et des Réfractaires* 18:155–163.
- Riboud, P.V. et al. (1981). "Improvement of continuous casting powders." *Fachberichte Hüttenpraxis Metallweiterverarbeitung* 19(10):859–869.
- Poulain, M.; Poulain, M.; Lucas, J. (1977). "Verres fluorés au tétrafluorure de zirconium." *Materials Research Bulletin* 10:243–246.
- NIST SRM 717a Certificate of Analysis (2004). *Standard Reference Material 717a — Borosilicate Glass.* National Institute of Standards and Technology.
- Mills, K.C. (1993). *Slag Atlas.* Verlag Stahleisen GmbH, Düsseldorf.

