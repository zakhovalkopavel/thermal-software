/**
 * All named heat-transfer correlations available in the dimensionless-numbers service.
 * Each value corresponds to a concrete implementation in dimensionless-numbers.service.ts.
 */
export type CorrelationName =
  | 'mills' | 'sieder_tate_laminar' | 'fully_developed_uniform_T' | 'fully_developed_uniform_q'
  | 'transitional' | 'gnielinski' | 'gnielinski_v2' | 'dittus_boelter'
  | 'sieder_tate_turbulent' | 'mikheev' | 'petukhov' | 'whitaker_pipe'
  | 'seban_mclaughlin' | 'webb_eckert_goldstein' | 'isachenko_roughness'
  | 'flat_plate_laminar' | 'flat_plate_turbulent' | 'flat_plate_mixed'
  | 'churchill_ozoe' | 'whitaker_flat_plate'
  | 'churchill_bernstein' | 'hilpert' | 'whitaker_cylinder'
  | 'sphere_ranz_marshall' | 'sphere_diffusion' | 'whitaker_sphere'
  | 'zukauskas' | 'whitaker_tube_bank'
  | 'churchill_chu' | 'churchill_chu_laminar' | 'churchill_chu_all_ra'
  | 'morgan' | 'churchill_chu_horizontal'
  | 'mcadams_hot_up' | 'mcadams_hot_down'
  | 'churchill_inclined'
  | 'churchill_sphere_natural'
  | 'raithby_hollands_cylinders' | 'raithby_hollands_spheres'
  | 'hollands' | 'globe_dropkin' | 'macgregor_emery'
  | 'mixed_power_sum'
  | 'gunn' | 'wakao_funazkri' | 'whitaker_packed_bed'
  | 'nusselt_condensation' | 'chen_condensation'
  | 'dorfman_disk' | 'bjorklund_kays'
  | 'martin_jet_single' | 'martin_jet_array'
  | 'elliptical_cylinder_owen' | 'cone_yuge';

