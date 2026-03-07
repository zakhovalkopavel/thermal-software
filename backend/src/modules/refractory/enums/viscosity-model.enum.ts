/**
 * Glass viscosity model identifiers — valid published models only.
 *
 * History:
 *   v1 had 9 entries (SODA_LIME_SILICA, BOROSILICATE, …). All removed 2026-03-06.
 *   URBAIN_1981 and RIBOUD_1981 were declared 2026-03-06 but never implemented —
 *   coefficients could not be verified from the original papers.
 *   Replaced 2026-03-07 by IIDA (Iida & Guthrie 1988 / Mills 2011) and
 *   NAKAMOTO_2007 (Nakamoto et al., ISIJ Int. 2007) which have verified coefficients
 *   from the Slag Atlas and the ISIJ paper respectively.
 */
export enum ViscosityModel {
  /** Lakatos (1976) isokom regression → 3-point VTF fit.
   *  Valid for soda-lime-silica and near-variants (SiO₂ 60–77%, Na₂O 10–17%).
   *  σ ≈ 3–5 °C on isokom temperatures. */
  LAKATOS_1976 = 'LAKATOS_1976',

  /** Fluegel (2007) global polynomial regression → 3-point VTF fit.
   *  Valid for broad silicate oxide glass space (SiO₂ 43–89 mol%, ~56 components).
   *  Also covers low-fluorine oxide-fluoride glasses (F ≤ 10.31 mol%).
   *  SE ≈ 9–17 °C per isokom level. */
  FLUEGEL_2007 = 'FLUEGEL_2007',

  /** Hetherington et al. (1964) two-parameter Arrhenius for pure fused silica.
   *  log₁₀(η [Pa·s]) = −3.905 + 31400/T_K.  Valid only for SiO₂ > 99 wt%. */
  HETHERINGTON_1964 = 'HETHERINGTON_1964',

  /** Iida model (Iida & Guthrie 1988; coefficients from Mills/NPL 2011 and Slag Atlas).
   *  Modified Weymann-Frenkel: η = A · η₀ · exp(E / B_i*)
   *  Uses modified basicity index B_i* with dynamic Al₂O₃ amphoteric treatment.
   *  Valid for: industrial mixed slags (BF, BOF, LF), CaF₂ ≤ 8 mol%, T = 1300–1800 °C, above liquidus.
   *  NOT for glasses below liquidus — no softening/annealing points.
   *  Preferred over Nakamoto when Al₂O₃ > 15% and CaF₂ < 8 mol%. */
  IIDA = 'IIDA',

  /** Nakamoto et al. (2007) activation-energy model for fluoride-bearing slags.
   *  η = A · T · exp(E / RT),  E = Σ eᵢ · Xᵢ,  ln(A) = −20.5 + 0.025 · M_avg.
   *  eᵢ coefficients from Table in ISIJ Int. 47(11):1583–1590, 2007.
   *  Valid for: CaF₂ > 5 mol% (mould fluxes, ESR slags), T = 1200–1900 °C, above liquidus.
   *  Preferred over Iida when CaF₂ > 8 mol% or fluoride is the primary flux.
   *  NOT for glasses below liquidus — no softening/annealing points. */
  NAKAMOTO_2007 = 'NAKAMOTO_2007',

  /** Composition is outside every supported model.
   *  Applies to: pure fluoride glass (ZBLAN-type — no reliable published regression),
   *  slags outside Iida/Nakamoto valid ranges, and any other unsupported system.
   *  Service returns NOT_SUPPORTED error rather than a bogus number. */
  NOT_SUPPORTED = 'NOT_SUPPORTED',
}

export const ViscosityModelNames: Record<ViscosityModel, string> = {
  [ViscosityModel.LAKATOS_1976]:      'Soda-Lime-Silica / Near-Variants (Lakatos 1976)',
  [ViscosityModel.FLUEGEL_2007]:      'Broad Silicate Glass incl. low-F oxide-fluoride (Fluegel 2007)',
  [ViscosityModel.HETHERINGTON_1964]: 'Pure Fused Silica (Hetherington 1964)',
  [ViscosityModel.IIDA]:              'Industrial Mixed Slag — Iida Model (Iida & Guthrie 1988 / Mills 2011)',
  [ViscosityModel.NAKAMOTO_2007]:     'Fluoride-Bearing Slag — Nakamoto 2007 (ISIJ Int. 47:1583)',
  [ViscosityModel.NOT_SUPPORTED]:     'Not Supported — no valid published model',
};

export enum ViscosityModelType {
  ARRHENIUS       = 'ARRHENIUS',
  /** Modified Weymann-Frenkel: η = A·η₀·exp(E/B_i*). Used by Iida model. */
  WEYMANN_FRENKEL = 'WEYMANN_FRENKEL',
  /** Modified Arrhenius: η = A·T·exp(E/RT). Used by Nakamoto 2007. */
  ARRHENIUS_T     = 'ARRHENIUS_T',
  VFT             = 'VFT',
}

export enum ConfidenceLevel {
  HIGH     = 'HIGH',      // Within validated ranges, established system
  MEDIUM   = 'MEDIUM',    // Minor deviations or near boundaries
  LOW      = 'LOW',       // Significant deviations or near model boundary
  VERY_LOW = 'VERY_LOW',  // Major extrapolation
}

export enum ExtrapolationRisk {
  NONE     = 'NONE',      // All components within validated ranges
  MINOR    = 'MINOR',     // Small deviations (<10%)
  MODERATE = 'MODERATE',  // Moderate deviations (10–25%)
  SEVERE   = 'SEVERE',    // Large deviations (>25%) or unknown system
}

