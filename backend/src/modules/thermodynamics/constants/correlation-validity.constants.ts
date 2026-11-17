import { FlowGeometry } from '../enums/flow-geometry.enum';
import { CorrelationName } from '../enums/correlation-name.enum';

/** Duct / non-circular channel geometries sharing pipe correlation validity. */
const DUCT_GEOMETRIES: FlowGeometry[] = [
  FlowGeometry.DUCT_SQUARE, FlowGeometry.DUCT_RECTANGULAR, FlowGeometry.DUCT_TRIANGULAR,
  FlowGeometry.DUCT_TRIANGULAR_SCALENE, FlowGeometry.DUCT_ELLIPTICAL, FlowGeometry.DUCT_TRAPEZOIDAL,
  FlowGeometry.PIPE_ANNULUS, FlowGeometry.PARALLEL_PLATES,
];

/** Validity bounds per correlation — used for preferred-correlation selector */
export const CORRELATION_VALIDITY: Partial<Record<CorrelationName, {
  geometries: FlowGeometry[];
  Re?: [number, number];
  Pr?: [number, number];
  Ra?: [number, number];
  notes?: string;
}>> = {
  [CorrelationName.Mills]:                   { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[0,2300] },
  [CorrelationName.SiederTateLaminar]:       { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[0,2300] },
  [CorrelationName.FullyDevelopedUniformT]:  { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[0,2300] },
  [CorrelationName.FullyDevelopedUniformQ]:  { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[0,2300] },
  [CorrelationName.Transitional]:            { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[2300,10000] },
  [CorrelationName.Gnielinski]:              { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[3000,5e6], Pr:[0.5,2000] },
  [CorrelationName.GnielinskiV2]:            { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[0,Infinity], Pr:[0.5,2000] },
  [CorrelationName.DittusBoelter]:           { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[1e4,Infinity], Pr:[0.6,160] },
  [CorrelationName.SiederTateTurbulent]:     { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[1e4,Infinity], Pr:[0.7,16700] },
  [CorrelationName.Mikheev]:                 { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[1e4,Infinity] },
  [CorrelationName.Petukhov]:                { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[1e4,5e6], Pr:[0.5,200] },
  [CorrelationName.WhitakerPipe]:            { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[1e4,5e5], Pr:[0.7,700] },
  [CorrelationName.WebbEckertGoldstein]:     { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[1e4,Infinity], Pr:[0.5,200] },
  [CorrelationName.IsachenkoRoughness]:      { geometries:[FlowGeometry.PIPE_CIRCULAR,...DUCT_GEOMETRIES], Re:[1e4,Infinity] },
  [CorrelationName.FlatPlateLaminar]:        { geometries:[FlowGeometry.FLAT_PLATE], Re:[0,5e5] },
  [CorrelationName.FlatPlateTurbulent]:      { geometries:[FlowGeometry.FLAT_PLATE], Re:[5e5,Infinity] },
  [CorrelationName.FlatPlateMixed]:          { geometries:[FlowGeometry.FLAT_PLATE], Re:[5e5,Infinity] },
  [CorrelationName.ChurchillOzoe]:           { geometries:[FlowGeometry.FLAT_PLATE], Re:[0,5e5] },
  [CorrelationName.WhitakerFlatPlate]:       { geometries:[FlowGeometry.FLAT_PLATE], Re:[4e4,3e5], Pr:[0.7,400] },
  [CorrelationName.ChurchillBernstein]:      { geometries:[FlowGeometry.CYLINDER_CROSSFLOW], Re:[0,Infinity] },
  [CorrelationName.Hilpert]:                 { geometries:[FlowGeometry.CYLINDER_CROSSFLOW], Re:[0.4,4e5], Pr:[0.7,Infinity] },
  [CorrelationName.WhitakerCylinder]:        { geometries:[FlowGeometry.CYLINDER_CROSSFLOW], Re:[10,1.5e5], Pr:[0.65,300] },
  [CorrelationName.SphereRanzMarshall]:      { geometries:[FlowGeometry.SPHERE_FORCED] },
  [CorrelationName.SphereDiffusion]:         { geometries:[FlowGeometry.SPHERE_FORCED] },
  [CorrelationName.WhitakerSphere]:          { geometries:[FlowGeometry.SPHERE_FORCED], Re:[3.5,7.6e4], Pr:[0.71,380] },
  [CorrelationName.Zukauskas]:               { geometries:[FlowGeometry.TUBE_BANK_INLINE,FlowGeometry.TUBE_BANK_STAGGERED], Re:[10,2e6], Pr:[0.7,500] },
  [CorrelationName.WhitakerTubeBank]:        { geometries:[FlowGeometry.TUBE_BANK_INLINE,FlowGeometry.TUBE_BANK_STAGGERED], Re:[1e3,2e5], Pr:[0.7,500] },
  [CorrelationName.ChurchillChu]:            { geometries:[FlowGeometry.VERTICAL_PLATE,FlowGeometry.VERTICAL_CYLINDER] },
  [CorrelationName.ChurchillChuLaminar]:     { geometries:[FlowGeometry.VERTICAL_PLATE,FlowGeometry.VERTICAL_CYLINDER], Ra:[0,1e9] },
  [CorrelationName.ChurchillChuAllRa]:       { geometries:[FlowGeometry.VERTICAL_PLATE,FlowGeometry.VERTICAL_CYLINDER], Ra:[0.1,1e12] },
  [CorrelationName.Morgan]:                  { geometries:[FlowGeometry.HORIZONTAL_CYLINDER], Ra:[1e-10,1e12] },
  [CorrelationName.ChurchillChuHorizontal]:  { geometries:[FlowGeometry.HORIZONTAL_CYLINDER], Ra:[1e-5,1e12] },
  [CorrelationName.McAdamsHotUp]:            { geometries:[FlowGeometry.HORIZONTAL_PLATE_HOT_UP], Ra:[1e4,1e11] },
  [CorrelationName.McAdamsHotDown]:          { geometries:[FlowGeometry.HORIZONTAL_PLATE_HOT_DOWN], Ra:[1e5,1e11] },
  [CorrelationName.ChurchillInclined]:       { geometries:[FlowGeometry.INCLINED_PLATE] },
  [CorrelationName.ChurchillSphereNatural]:  { geometries:[FlowGeometry.SPHERE_NATURAL], Ra:[0,1e11], Pr:[0.7,Infinity] },
  [CorrelationName.RaithbyHollandsCylinders]:{ geometries:[FlowGeometry.CONCENTRIC_CYLINDERS] },
  [CorrelationName.RaithbyHollandsSpheres]:  { geometries:[FlowGeometry.CONCENTRIC_SPHERES] },
  [CorrelationName.Hollands]:                { geometries:[FlowGeometry.HORIZONTAL_CAVITY], Ra:[1708,1e8] },
  [CorrelationName.GlobeDropkin]:            { geometries:[FlowGeometry.HORIZONTAL_CAVITY], Ra:[3e5,7e9] },
  [CorrelationName.MacGregorEmery]:          { geometries:[FlowGeometry.VERTICAL_CAVITY], Ra:[1e3,1e10] },
  [CorrelationName.MixedPowerSum]:           { geometries:[FlowGeometry.MIXED_PIPE_VERTICAL,FlowGeometry.MIXED_PLATE_VERTICAL] },
  [CorrelationName.Gunn]:                    { geometries:[FlowGeometry.PACKED_BED,FlowGeometry.PACKED_BED_CYLINDER], Re:[0,1e5] },
  [CorrelationName.WakaoFunazkri]:           { geometries:[FlowGeometry.PACKED_BED] },
  [CorrelationName.WhitakerPackedBed]:       { geometries:[FlowGeometry.PACKED_BED], Re:[10,1e4], Pr:[0.7,380] },
  [CorrelationName.NusseltCondensation]:     { geometries:[FlowGeometry.CONDENSATION_VERTICAL_PLATE,FlowGeometry.CONDENSATION_HORIZONTAL_TUBE] },
  [CorrelationName.ChenCondensation]:        { geometries:[FlowGeometry.CONDENSATION_VERTICAL_PLATE] },
  [CorrelationName.DorfmanDisk]:             { geometries:[FlowGeometry.ROTATING_DISK] },
  [CorrelationName.BjorklundKays]:           { geometries:[FlowGeometry.ROTATING_CYLINDER] },
  [CorrelationName.MartinJetSingle]:         { geometries:[FlowGeometry.IMPINGING_JET_SINGLE], Re:[2000,4e5] },
  [CorrelationName.MartinJetArray]:          { geometries:[FlowGeometry.IMPINGING_JET_ARRAY], Re:[2000,4e5] },
  [CorrelationName.SebanMcLaughlin]:         { geometries:[FlowGeometry.HELICAL_COIL] },
  [CorrelationName.EllipticalCylinderOwen]:  { geometries:[FlowGeometry.ELLIPTICAL_CYLINDER] },
  [CorrelationName.ConeYuge]:                { geometries:[FlowGeometry.CONE_CROSSFLOW] },
};
