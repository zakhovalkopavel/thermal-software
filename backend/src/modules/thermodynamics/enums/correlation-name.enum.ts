/**
 * Enum of all named heat-transfer correlations available in the system.
 *
 * Each value is the stable string key used in API inputs/outputs and
 * correlation-validity tables.  Using an enum (rather than a plain string
 * union type) lets call-sites use `CorrelationName.gnielinski` instead of
 * the raw string `'gnielinski'`, giving compile-time safety and IDE
 * auto-complete.
 *
 * Convention: never rename or remove an existing member — downstream data
 * (saved reports, test fixtures) depend on value stability.
 */
export enum CorrelationName {
  // ── Pipe / duct internal flow ─────────────────────────────────────────
  Mills                    = 'mills',
  SiederTateLaminar        = 'sieder_tate_laminar',
  FullyDevelopedUniformT   = 'fully_developed_uniform_T',
  FullyDevelopedUniformQ   = 'fully_developed_uniform_q',
  Transitional             = 'transitional',
  Gnielinski               = 'gnielinski',
  GnielinskiV2             = 'gnielinski_v2',
  DittusBoelter            = 'dittus_boelter',
  SiederTateTurbulent      = 'sieder_tate_turbulent',
  Mikheev                  = 'mikheev',
  Petukhov                 = 'petukhov',
  WhitakerPipe             = 'whitaker_pipe',
  SebanMcLaughlin          = 'seban_mclaughlin',
  WebbEckertGoldstein      = 'webb_eckert_goldstein',
  IsachenkoRoughness       = 'isachenko_roughness',

  // ── Flat plate external flow ──────────────────────────────────────────
  FlatPlateLaminar         = 'flat_plate_laminar',
  FlatPlateTurbulent       = 'flat_plate_turbulent',
  FlatPlateMixed           = 'flat_plate_mixed',
  ChurchillOzoe            = 'churchill_ozoe',
  WhitakerFlatPlate        = 'whitaker_flat_plate',

  // ── External cylinder crossflow ───────────────────────────────────────
  ChurchillBernstein       = 'churchill_bernstein',
  Hilpert                  = 'hilpert',
  WhitakerCylinder         = 'whitaker_cylinder',

  // ── External sphere ───────────────────────────────────────────────────
  SphereRanzMarshall       = 'sphere_ranz_marshall',
  SphereDiffusion          = 'sphere_diffusion',
  WhitakerSphere           = 'whitaker_sphere',

  // ── Tube banks ────────────────────────────────────────────────────────
  Zukauskas                = 'zukauskas',
  WhitakerTubeBank         = 'whitaker_tube_bank',

  // ── Natural convection ────────────────────────────────────────────────
  ChurchillChu             = 'churchill_chu',
  ChurchillChuLaminar      = 'churchill_chu_laminar',
  ChurchillChuAllRa        = 'churchill_chu_all_ra',
  Morgan                   = 'morgan',
  ChurchillChuHorizontal   = 'churchill_chu_horizontal',
  McAdamsHotUp             = 'mcadams_hot_up',
  McAdamsHotDown           = 'mcadams_hot_down',
  ChurchillInclined        = 'churchill_inclined',
  ChurchillSphereNatural   = 'churchill_sphere_natural',
  RaithbyHollandsCylinders = 'raithby_hollands_cylinders',
  RaithbyHollandsSpheres   = 'raithby_hollands_spheres',
  Hollands                 = 'hollands',
  GlobeDropkin             = 'globe_dropkin',
  MacGregorEmery           = 'macgregor_emery',
  MixedPowerSum            = 'mixed_power_sum',

  // ── Packed beds ───────────────────────────────────────────────────────
  Gunn                     = 'gunn',
  WakaoFunazkri            = 'wakao_funazkri',
  WhitakerPackedBed        = 'whitaker_packed_bed',

  // ── Condensation ─────────────────────────────────────────────────────
  NusseltCondensation      = 'nusselt_condensation',
  ChenCondensation         = 'chen_condensation',

  // ── Rotating surfaces ─────────────────────────────────────────────────
  DorfmanDisk              = 'dorfman_disk',
  BjorklundKays            = 'bjorklund_kays',

  // ── Impinging jets ────────────────────────────────────────────────────
  MartinJetSingle          = 'martin_jet_single',
  MartinJetArray           = 'martin_jet_array',

  // ── Other external geometries ─────────────────────────────────────────
  EllipticalCylinderOwen   = 'elliptical_cylinder_owen',
  ConeYuge                 = 'cone_yuge',
}

