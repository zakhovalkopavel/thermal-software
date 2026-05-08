# CH07 Appendix A — Internal Flow Correlations

**Back:** [CH07_DIMENSIONLESS_NUMBERS.md](CH07_DIMENSIONLESS_NUMBERS.md)

Covers `FlowGeometry` values: `PIPE_CIRCULAR`, `PIPE_ANNULUS`, `DUCT_*`, `PARALLEL_PLATES`,
`HELICAL_COIL`, `CORRUGATED_PIPE`, `RIBBED_CHANNEL`.

All duct variants compute `D_h = 4A/P` then delegate to `PIPE_CIRCULAR` correlations.
Hydraulic diameter formulas by geometry → [CH08_GEOMETRY.md](CH08_GEOMETRY.md).

---

## PIPE_CIRCULAR — laminar (Re < 2300)

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `mills` *(default)* | `Nu = 3.66 + (0.065·Re·Pr·D/L) / (1 + 0.4·(Re·Pr·D/L)^(2/3))` | all laminar Re, requires D and L | [recuperator.js:871](../../../legacy/scripts/recuperator.js#L871); Incropera §8.4 |
| `sieder_tate_laminar` | `Nu = 1.86·(Re·Pr·D/L)^(1/3)·(μ/μ_s)^0.14` | Re < 2300, requires μ_s, D, L | [recuperator.js:877](../../../legacy/scripts/recuperator.js#L877); Sieder & Tate (1936) |
| `fully_developed_uniform_T` | `Nu = 3.66` (constant) | Re < 2300, L/D → ∞, UWT | Incropera §8.4 |
| `fully_developed_uniform_q` | `Nu = 4.36` (constant) | Re < 2300, L/D → ∞, UHF | Incropera §8.4 |

> **Mills formula** combines developing-flow entrance effects with fully-developed laminar Nu.
> It reduces to `Nu = 3.66` as `L/D → ∞` and is the legacy default for all laminar Re.

---

## PIPE_CIRCULAR — transitional (2300 ≤ Re ≤ 10000)

| Correlation | Formula | Source |
|---|---|---|
| `transitional` | `Nu = 0.008·Re^0.9·Pr^0.43` | [recuperator.js:882](../../../legacy/scripts/recuperator.js#L882) |

---

## PIPE_CIRCULAR — turbulent (Re > 10000)

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `gnielinski` *(default)* | `Nu = (f/8)·(Re−1000)·Pr / (1 + 12.7·√(f/8)·(Pr^(2/3)−1))` `f = (0.79·ln Re − 1.64)^−2` | 3000 ≤ Re ≤ 5×10⁶, 0.5 ≤ Pr ≤ 2000 | [recuperator.js:892](../../../legacy/scripts/recuperator.js#L892)–[:895](../../../legacy/scripts/recuperator.js#L895); Gnielinski (1976); Incropera §8.5 |
| `gnielinski_v2` | Churchill (1977) friction factor in Gnielinski form — see §A2 below | any Re ≥ 0, any roughness | Churchill (1977); see §A2 |
| `dittus_boelter` | `Nu = 0.023·Re^0.8·Pr^n` — n = 0.4 heating, n = 0.3 cooling | Re ≥ 10⁴, 0.6 ≤ Pr ≤ 160, L/D ≥ 60 | [recuperator.js:908](../../../legacy/scripts/recuperator.js#L908)–[:915](../../../legacy/scripts/recuperator.js#L915); Dittus & Boelter (1930); Incropera §8.5 |
| `sieder_tate_turbulent` | `Nu = 0.027·Re^(4/5)·Pr^(1/3)·(μ/μ_s)^0.14` | Re ≥ 10⁴, 0.7 ≤ Pr ≤ 16700, L/D ≥ 10 | [recuperator.js:903](../../../legacy/scripts/recuperator.js#L903); Sieder & Tate (1936) |
| `mikheev` | `Nu = 0.021·Re^0.8·Pr^0.43·(Pr/Pr_s)^0.25·ε_l` — ε_l = correction factor (1.2 legacy default) | Re ≥ 10⁴ | [recuperator.js:922](../../../legacy/scripts/recuperator.js#L922); Mikheev (1956) |
| `petukhov` | `Nu = (f/8)·Re·Pr / (1.07 + 12.7·√(f/8)·(Pr^(2/3)−1))` | 10⁴ ≤ Re ≤ 5×10⁶, 0.5 ≤ Pr ≤ 200 | Petukhov (1970); Incropera §8.5; VDI G1 |
| `whitaker_pipe` | `Nu = 0.015·Re^0.83·Pr^(1/3)·(μ/μ_w)^0.14` | 10⁴ ≤ Re ≤ 5×10⁵, 0.7 ≤ Pr ≤ 700, requires μ_w | Whitaker (1972) AIChE — see §W1 below |

### Default selection logic (verbatim from legacy)

Preserved exactly from [recuperator.js:922](../../../legacy/scripts/recuperator.js#L922)–[recuperator.js:968](../../../legacy/scripts/recuperator.js#L968):

```
isNatural = (w === 0)
            OR (laminar  AND Nu_natural/L > Nu_mills/D)
            OR (transient AND Nu_natural/L > Nu_transitional/D)
            OR (turbulent AND Nu_natural/L > Nu_gnielinski/D)

return:
  isNatural  → Churchill-Chu (see Appendix B)
  laminar    → mills
  transient  → Re < 3000 ? transitional : gnielinski
  turbulent  → gnielinski
```

---

## HELICAL_COIL

`a` = pipe radius, `b` = coil radius. Dean number: `De = Re·√(a/b)`.

| Regime | Formula | Source |
|---|---|---|
| Laminar | `Nu = 0.036·Re^0.5·Pr^0.43·(a/b)^0.1` | Seban & McLaughlin (1963); VDI L1.3 |
| Turbulent | `Nu = Nu_straight·(1 + 3.6·(1−a/b)·(a/b)^0.8)` | Seban & McLaughlin (1963); VDI L1.3 |
| Critical Re | `Re_cr = 2300·(1 + 8.6·(a/b)^0.45)` | Schmidt (1967); Cengel §8-4 |

---

## CORRUGATED_PIPE / RIBBED_CHANNEL

`e` = rib/corrugation height, `p` = pitch.

| Range | Formula | Source |
|---|---|---|
| `0.01 ≤ e/D ≤ 0.05`, `10 ≤ p/e ≤ 40` | `St·Pr^(2/3) = (f/2) / (1 + √(f/2)·f(e+))` — Webb-Eckert-Goldstein | Incropera §8.7; VDI G8 |
| Simplified turbulent | `Nu = 0.023·Re^0.8·Pr^0.4·(1 + 1.77·(e/D))` | Isachenko et al. |

---

## §A2 — Churchill (1977): friction-factor-based gnielinski_v2

**Paper:** S.W. Churchill, "Friction-factor equation spans all fluid-flow regimes,"
*Chemical Engineering*, 84(24):91–92, November 7, 1977.

### Friction factor (all Re, any roughness)

```
f = 8·[ (8/Re)^12 + (A + B)^(−3/2) ]^(1/12)

A = [ 2.457·ln(1 / ((7/Re)^0.9 + 0.27·ε_s/D)) ]^16

B = (37530/Re)^16
```

- Smooth pipe (ε_s/D = 0): `A = [2.457·ln(1/(7/Re)^0.9)]^16`
- Laminar Re < 2300: converges to `f = 64/Re`
- Turbulent Re > 4000: converges to Colebrook

### Nu (Gnielinski form using Churchill f)

```
Nu = (f/8)·(Re − 1000)·Pr / (1 + 12.7·√(f/8)·(Pr^(2/3) − 1))
```

**Validity:** 3000 ≤ Re ≤ 5×10⁶, 0.5 ≤ Pr ≤ 2000, smooth or rough pipe.

**`CorrelationName`:** `'gnielinski_v2'`  **`FlowGeometry`:** `PIPE_CIRCULAR` and D_h ducts.

---

## §W1 — Whitaker (1972): Internal pipe flow

**Paper:** S. Whitaker, "Forced convection heat transfer correlations …"
*AIChE Journal*, 18(2):361–371, 1972 — Eq.(1), page 362.

```
Nu_D = 0.015·Re_D^0.83·Pr^(1/3)·(μ/μ_w)^0.14
```

**Validity:** 10⁴ ≤ Re_D ≤ 5×10⁵, 0.7 ≤ Pr ≤ 700, 0.025 ≤ (μ/μ_w) ≤ 5.6, L/D ≥ 10.

Properties at bulk temperature. μ_w at wall temperature.

**vs Dittus-Boelter:** Whitaker uses exponent 0.83 on Re (vs 0.8) — better fit across
full turbulent Re range per Whitaker (1972) p.362. The (μ/μ_w)^0.14 viscosity correction
replaces the Dittus-Boelter n = 0.3/0.4 heating/cooling split.

**`CorrelationName`:** `'whitaker_pipe'`  **`FlowGeometry`:** `PIPE_CIRCULAR` and D_h ducts.

