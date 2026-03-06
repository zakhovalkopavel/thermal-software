/**
 * Glass viscosity model identifiers — valid published models only.
 *
 * History:
 *   v1 had 9 entries (SODA_LIME_SILICA, BOROSILICATE, ALUMINOSILICATE, LEAD_GLASS,
 *   PURE_SILICA, SODIUM_SILICATE, SLAG_CAO_AL2O3, FLUORIDE_GLASS, MULTI_COMPONENT_MIXING).
 *   All were removed on 2026-03-06 after audit found every one had wrong parameters,
 *   a wrong model architecture, or a wrong formula convention.
 *   See docs/algorithms/glass-viscosity/VISCOSITY_PARAMETERS_AUDIT.md.
 *
 *   2026-03-06: URBAIN_1981 and RIBOUD_1981 added for slags and fluoride-bearing melts.
 *   See docs/algorithms/glass-viscosity/SLAG_FLUORIDE_EXPANSION_PLAN.md.
 */
export enum ViscosityModel {
  /** Lakatos (1976) isokom regression → 3-point VTF fit.
   *  Valid for soda-lime-silica and near-variants (SiO₂ 60–77%, Na₂O 10–17%).
   *  σ ≈ 3–5°C on isokom temperatures. */
  LAKATOS_1976 = 'LAKATOS_1976',

  /** Fluegel (2007) global polynomial regression → 3-point VTF fit.
   *  Valid for broad silicate oxide glass space (SiO₂ 43–89 mol%, ~56 components).
   *  Also covers low-fluorine oxide-fluoride glasses (F ≤ 10.31 mol%).
   *  SE ≈ 9–17°C per isokom level. */
  FLUEGEL_2007 = 'FLUEGEL_2007',

  /** Hetherington et al. (1964) two-parameter Arrhenius for pure fused silica.
   *  log₁₀(η [Pa·s]) = −3.905 + 31400/T_K.  Valid only for SiO₂ > 99 wt%. */
  HETHERINGTON_1964 = 'HETHERINGTON_1964',

  /** Urbain (1981) — CaO-Al₂O₃-SiO₂ molten slag above liquidus.
   *  Formula: log₁₀(η·T^0.5) = A_m + B_m/T, where A_m and B_m are derived
   *  from the optical basicity (Λ) of the melt.
   *  Valid for: CaO-Al₂O₃-SiO₂ system, T = 1300–1700°C, melt above liquidus.
   *  NOT for glasses below liquidus — does not predict softening/annealing points.
   *  Reference: Urbain, G. (1981). Rev. Int. Hautes Tempér. Réfract. 18:155–163. */
  URBAIN_1981 = 'URBAIN_1981',

  /** Riboud (1981) — industrial mixed slag including fluoride-bearing slags.
   *  Formula: η = A · exp(B/T) (Pa·s, Arrhenius directly — not log₁₀, not VTF).
   *  A and B are computed from composition coefficients for:
   *  CaO, SiO₂, Al₂O₃, MgO, CaF₂, FeO, MnO, Na₂O.
   *  Valid for: industrial mixed slags (continuous casting powders, mould slags),
   *  fluoride-bearing slags (CaF₂ as explicit term), T = 1300–1600°C above liquidus.
   *  Preferred over Urbain when CaF₂, FeO, MgO, or Na₂O are significant.
   *  NOT for glasses below liquidus — does not predict softening/annealing points.
   *  Reference: Riboud et al. (1981). Fachber. Hüttenpraxis 19(10):859–869. */
  RIBOUD_1981 = 'RIBOUD_1981',

  /** Composition is outside every supported model.
   *  Applies to: pure fluoride glass (ZBLAN-type — no reliable published regression),
   *  slags with composition outside Urbain/Riboud valid ranges, and any other system
   *  not covered above.  Service returns NOT_SUPPORTED error rather than a bogus number. */
  NOT_SUPPORTED = 'NOT_SUPPORTED',
}

export const ViscosityModelNames: Record<ViscosityModel, string> = {
  [ViscosityModel.LAKATOS_1976]: 'Soda-Lime-Silica / Near-Variants (Lakatos 1976)',
  [ViscosityModel.FLUEGEL_2007]: 'Broad Silicate Glass incl. low-F oxide-fluoride (Fluegel 2007)',
  [ViscosityModel.HETHERINGTON_1964]: 'Pure Fused Silica (Hetherington 1964)',
  [ViscosityModel.URBAIN_1981]: 'CaO-Al₂O₃-SiO₂ Slag above Liquidus (Urbain 1981)',
  [ViscosityModel.RIBOUD_1981]: 'Industrial Mixed Slag / Fluoride-Bearing Slag (Riboud 1981)',
  [ViscosityModel.NOT_SUPPORTED]: 'Not Supported — no valid published model',
};

export enum ViscosityModelType {
  ARRHENIUS = 'ARRHENIUS',
  /** Arrhenius applied directly to η (not log₁₀): η = A·exp(B/T).
   *  Used by Riboud (1981). Result is viscosity in Pa·s, not log units. */
  ARRHENIUS_ETA = 'ARRHENIUS_ETA',
  /** Modified Arrhenius applied to η·T^0.5: log₁₀(η·T^0.5) = A + B/T.
   *  Used by Urbain (1981). Result is extracted as η = 10^(A+B/T) / T^0.5. */
  ARRHENIUS_URBAIN = 'ARRHENIUS_URBAIN',
  VFT = 'VFT',
}

export enum ConfidenceLevel {
  HIGH = 'HIGH',           // Within validated ranges, established system
  MEDIUM = 'MEDIUM',       // Minor deviations or near boundaries
  LOW = 'LOW',             // Significant deviations or near model boundary
  VERY_LOW = 'VERY_LOW',   // Major extrapolation
}

export enum ExtrapolationRisk {
  NONE = 'NONE',           // All components within validated ranges
  MINOR = 'MINOR',         // Small deviations (<10%)
  MODERATE = 'MODERATE',   // Moderate deviations (10-25%)
  SEVERE = 'SEVERE',       // Large deviations (>25%) or unknown system
}
