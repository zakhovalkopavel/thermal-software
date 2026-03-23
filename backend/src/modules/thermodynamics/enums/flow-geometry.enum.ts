export enum FlowGeometry {
  // ── Internal forced convection ──────────────────────────────────────────
  PIPE_CIRCULAR             = 'pipe_circular',
  PIPE_ANNULUS              = 'pipe_annulus',
  DUCT_SQUARE               = 'duct_square',
  DUCT_RECTANGULAR          = 'duct_rectangular',
  DUCT_TRIANGULAR           = 'duct_triangular',
  DUCT_TRIANGULAR_SCALENE   = 'duct_triangular_scalene',
  DUCT_ELLIPTICAL           = 'duct_elliptical',
  DUCT_TRAPEZOIDAL          = 'duct_trapezoidal',
  PARALLEL_PLATES           = 'parallel_plates',
  HELICAL_COIL              = 'helical_coil',
  CORRUGATED_PIPE           = 'corrugated_pipe',
  RIBBED_CHANNEL            = 'ribbed_channel',
  // ── External forced convection ─────────────────────────────────────────
  FLAT_PLATE                = 'flat_plate',
  FLAT_PLATE_ROUGH          = 'flat_plate_rough',
  CYLINDER_CROSSFLOW        = 'cylinder_crossflow',
  SPHERE_FORCED             = 'sphere_forced',
  TUBE_BANK_INLINE          = 'tube_bank_inline',
  TUBE_BANK_STAGGERED       = 'tube_bank_staggered',
  CONE_CROSSFLOW            = 'cone_crossflow',
  ELLIPTICAL_CYLINDER       = 'elliptical_cylinder',
  // ── Natural convection ─────────────────────────────────────────────────
  VERTICAL_PLATE            = 'vertical_plate',
  VERTICAL_CYLINDER         = 'vertical_cylinder',
  HORIZONTAL_CYLINDER       = 'horizontal_cylinder',
  HORIZONTAL_PLATE_HOT_UP   = 'horizontal_plate_hot_up',
  HORIZONTAL_PLATE_HOT_DOWN = 'horizontal_plate_hot_down',
  INCLINED_PLATE            = 'inclined_plate',
  SPHERE_NATURAL            = 'sphere_natural',
  CONCENTRIC_CYLINDERS      = 'concentric_cylinders',
  CONCENTRIC_SPHERES        = 'concentric_spheres',
  HORIZONTAL_CAVITY         = 'horizontal_cavity',
  VERTICAL_CAVITY           = 'vertical_cavity',
  // ── Mixed (forced + natural) ───────────────────────────────────────────
  MIXED_PIPE_VERTICAL       = 'mixed_pipe_vertical',
  MIXED_PLATE_VERTICAL      = 'mixed_plate_vertical',
  // ── Packed / porous beds ───────────────────────────────────────────────
  PACKED_BED                = 'packed_bed',
  PACKED_BED_CYLINDER       = 'packed_bed_cylinder',
  FLUIDIZED_BED             = 'fluidized_bed',
  // ── Phase change ──────────────────────────────────────────────────────
  CONDENSATION_VERTICAL_PLATE  = 'condensation_vertical_plate',
  CONDENSATION_HORIZONTAL_TUBE = 'condensation_horizontal_tube',
  POOL_BOILING              = 'pool_boiling',
  // ── Rotating / special ─────────────────────────────────────────────────
  ROTATING_DISK             = 'rotating_disk',
  ROTATING_CYLINDER         = 'rotating_cylinder',
  IMPINGING_JET_SINGLE      = 'impinging_jet_single',
  IMPINGING_JET_ARRAY       = 'impinging_jet_array',
}

