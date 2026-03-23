import { FlowGeometry } from '../enums/flow-geometry.enum';
import { FlowRegime } from '../types/flow-regime.type';
import { CorrelationName } from '../types/correlation-name.type';

/** Validity bounds per correlation — used for preferred-correlation selector */
export const CORRELATION_VALIDITY: Record<string, {
  geometries: FlowGeometry[];
  Re?: [number, number];
  Pr?: [number, number];
  Ra?: [number, number];
  notes?: string;
}> = {
  mills:                     { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[0,2300] },
  sieder_tate_laminar:       { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[0,2300] },
  fully_developed_uniform_T: { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[0,2300] },
  fully_developed_uniform_q: { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[0,2300] },
  transitional:              { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[2300,10000] },
  gnielinski:                { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[3000,5e6], Pr:[0.5,2000] },
  gnielinski_v2:             { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[0,Infinity], Pr:[0.5,2000] },
  dittus_boelter:            { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[1e4,Infinity], Pr:[0.6,160] },
  sieder_tate_turbulent:     { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[1e4,Infinity], Pr:[0.7,16700] },
  mikheev:                   { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[1e4,Infinity] },
  petukhov:                  { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[1e4,5e6], Pr:[0.5,200] },
  whitaker_pipe:             { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_VARIANTS()], Re:[1e4,5e5], Pr:[0.7,700] },
  flat_plate_laminar:        { geometries:[FlowGeometry.FLAT_PLATE], Re:[0,5e5] },
  flat_plate_turbulent:      { geometries:[FlowGeometry.FLAT_PLATE], Re:[5e5,Infinity] },
  flat_plate_mixed:          { geometries:[FlowGeometry.FLAT_PLATE], Re:[5e5,Infinity] },
  churchill_ozoe:            { geometries:[FlowGeometry.FLAT_PLATE], Re:[0,5e5] },
  whitaker_flat_plate:       { geometries:[FlowGeometry.FLAT_PLATE], Re:[4e4,3e5], Pr:[0.7,400] },
  churchill_bernstein:       { geometries:[FlowGeometry.CYLINDER_CROSSFLOW], Re:[0,Infinity] },
  hilpert:                   { geometries:[FlowGeometry.CYLINDER_CROSSFLOW], Re:[0.4,4e5], Pr:[0.7,Infinity] },
  whitaker_cylinder:         { geometries:[FlowGeometry.CYLINDER_CROSSFLOW], Re:[10,1.5e5], Pr:[0.65,300] },
  sphere_ranz_marshall:      { geometries:[FlowGeometry.SPHERE_FORCED] },
  sphere_diffusion:          { geometries:[FlowGeometry.SPHERE_FORCED] },
  whitaker_sphere:           { geometries:[FlowGeometry.SPHERE_FORCED], Re:[3.5,7.6e4], Pr:[0.71,380] },
  zukauskas:                 { geometries:[FlowGeometry.TUBE_BANK_INLINE,FlowGeometry.TUBE_BANK_STAGGERED], Re:[10,2e6], Pr:[0.7,500] },
  whitaker_tube_bank:        { geometries:[FlowGeometry.TUBE_BANK_INLINE,FlowGeometry.TUBE_BANK_STAGGERED], Re:[1e3,2e5], Pr:[0.7,500] },
  churchill_chu:             { geometries:[FlowGeometry.VERTICAL_PLATE,FlowGeometry.VERTICAL_CYLINDER] },
  churchill_chu_laminar:     { geometries:[FlowGeometry.VERTICAL_PLATE,FlowGeometry.VERTICAL_CYLINDER], Ra:[0,1e9] },
  churchill_chu_all_ra:      { geometries:[FlowGeometry.VERTICAL_PLATE,FlowGeometry.VERTICAL_CYLINDER], Ra:[0.1,1e12] },
  morgan:                    { geometries:[FlowGeometry.HORIZONTAL_CYLINDER], Ra:[1e-10,1e12] },
  churchill_chu_horizontal:  { geometries:[FlowGeometry.HORIZONTAL_CYLINDER], Ra:[1e-5,1e12] },
  mcadams_hot_up:            { geometries:[FlowGeometry.HORIZONTAL_PLATE_HOT_UP], Ra:[1e4,1e11] },
  mcadams_hot_down:          { geometries:[FlowGeometry.HORIZONTAL_PLATE_HOT_DOWN], Ra:[1e5,1e11] },
  churchill_inclined:        { geometries:[FlowGeometry.INCLINED_PLATE] },
  churchill_sphere_natural:  { geometries:[FlowGeometry.SPHERE_NATURAL], Ra:[0,1e11], Pr:[0.7,Infinity] },
  raithby_hollands_cylinders:{ geometries:[FlowGeometry.CONCENTRIC_CYLINDERS] },
  raithby_hollands_spheres:  { geometries:[FlowGeometry.CONCENTRIC_SPHERES] },
  hollands:                  { geometries:[FlowGeometry.HORIZONTAL_CAVITY], Ra:[1708,1e8] },
  globe_dropkin:             { geometries:[FlowGeometry.HORIZONTAL_CAVITY], Ra:[3e5,7e9] },
  macgregor_emery:           { geometries:[FlowGeometry.VERTICAL_CAVITY], Ra:[1e3,1e10] },
  mixed_power_sum:           { geometries:[FlowGeometry.MIXED_PIPE_VERTICAL,FlowGeometry.MIXED_PLATE_VERTICAL] },
  gunn:                      { geometries:[FlowGeometry.PACKED_BED,FlowGeometry.PACKED_BED_CYLINDER], Re:[0,1e5] },
  wakao_funazkri:            { geometries:[FlowGeometry.PACKED_BED] },
  whitaker_packed_bed:       { geometries:[FlowGeometry.PACKED_BED], Re:[10,1e4], Pr:[0.7,380] },
  nusselt_condensation:      { geometries:[FlowGeometry.CONDENSATION_VERTICAL_PLATE,FlowGeometry.CONDENSATION_HORIZONTAL_TUBE] },
  chen_condensation:         { geometries:[FlowGeometry.CONDENSATION_VERTICAL_PLATE] },
  dorfman_disk:              { geometries:[FlowGeometry.ROTATING_DISK] },
  bjorklund_kays:            { geometries:[FlowGeometry.ROTATING_CYLINDER] },
  martin_jet_single:         { geometries:[FlowGeometry.IMPINGING_JET_SINGLE], Re:[2000,4e5] },
  martin_jet_array:          { geometries:[FlowGeometry.IMPINGING_JET_ARRAY], Re:[2000,4e5] },
  seban_mclaughlin:          { geometries:[FlowGeometry.HELICAL_COIL] },
  elliptical_cylinder_owen:  { geometries:[FlowGeometry.ELLIPTICAL_CYLINDER] },
  cone_yuge:                 { geometries:[FlowGeometry.CONE_CROSSFLOW] },
};

function DUCT_VARIANTS(): FlowGeometry[] {
  return [
    FlowGeometry.DUCT_SQUARE, FlowGeometry.DUCT_RECTANGULAR, FlowGeometry.DUCT_TRIANGULAR,
    FlowGeometry.DUCT_TRIANGULAR_SCALENE, FlowGeometry.DUCT_ELLIPTICAL, FlowGeometry.DUCT_TRAPEZOIDAL,
    FlowGeometry.PIPE_ANNULUS, FlowGeometry.PARALLEL_PLATES,
  ];
}

/** All correlations valid for a given geometry */
export function availableCorrelations(geo: FlowGeometry): CorrelationName[] {
  return (Object.keys(CORRELATION_VALIDITY) as CorrelationName[])
    .filter(k => CORRELATION_VALIDITY[k].geometries.includes(geo));
}

/**
 * Determine flow regime automatically from geometry and numbers.
 * Optional `forced` value takes priority.
 */
export function resolveRegime(
  geo: FlowGeometry,
  Re: number | undefined,
  Ra: number | undefined,
  forced?: FlowRegime,
): FlowRegime {
  if (forced) return forced;
  const naturalGeos: FlowGeometry[] = [
    FlowGeometry.VERTICAL_PLATE, FlowGeometry.VERTICAL_CYLINDER,
    FlowGeometry.HORIZONTAL_CYLINDER, FlowGeometry.HORIZONTAL_PLATE_HOT_UP,
    FlowGeometry.HORIZONTAL_PLATE_HOT_DOWN, FlowGeometry.INCLINED_PLATE,
    FlowGeometry.SPHERE_NATURAL, FlowGeometry.CONCENTRIC_CYLINDERS,
    FlowGeometry.CONCENTRIC_SPHERES, FlowGeometry.HORIZONTAL_CAVITY,
    FlowGeometry.VERTICAL_CAVITY,
  ];
  if (naturalGeos.includes(geo))    return FlowRegime.NATURAL;
  if (geo === FlowGeometry.MIXED_PIPE_VERTICAL || geo === FlowGeometry.MIXED_PLATE_VERTICAL)
    return FlowRegime.MIXED;
  if (Re === undefined)             return Ra !== undefined ? FlowRegime.NATURAL : FlowRegime.LAMINAR;
  if (Re < 2300)                    return FlowRegime.LAMINAR;
  if (Re < 4000)                    return FlowRegime.TRANSITIONAL;
  return FlowRegime.TURBULENT;
}

/**
 * Validate whether a preferred correlation is applicable.
 * Returns null if valid, or a rejection reason string.
 */
export function validatePreferredCorrelation(
  corr: CorrelationName,
  geo: FlowGeometry,
  Re: number | undefined,
  Pr: number | undefined,
  Ra: number | undefined,
): string | null {
  const v = CORRELATION_VALIDITY[corr];
  if (!v) return `correlation '${corr}' unknown`;
  if (!v.geometries.includes(geo)) return `not applicable to geometry ${geo}`;
  if (v.Re && Re !== undefined && (Re < v.Re[0] || Re > v.Re[1]))
    return `Re=${Re.toFixed(0)} outside range [${v.Re[0]},${v.Re[1]}]`;
  if (v.Pr && Pr !== undefined && (Pr < v.Pr[0] || Pr > v.Pr[1]))
    return `Pr=${Pr.toFixed(3)} outside range [${v.Pr[0]},${v.Pr[1]}]`;
  if (v.Ra && Ra !== undefined && (Ra < v.Ra[0] || Ra > v.Ra[1]))
    return `Ra=${Ra.toExponential(2)} outside range [${v.Ra[0]},${v.Ra[1]}]`;
  return null;
}

