import { CorrelationName } from '../enums/correlation-name.enum';
import { CorrelationFamily } from '../enums/correlation-family.enum';

/**
 * Maps every CorrelationFamily to the set of CorrelationName values it contains.
 * Used by correlation-selector to dispatch a correlation to the correct Nu-formula helper.
 *
 * Invariant: every CorrelationName member must appear in exactly one family set.
 */
export const CORRELATION_FAMILY_MAP: Readonly<Record<CorrelationFamily, ReadonlySet<CorrelationName>>> = {
  [CorrelationFamily.PipeDuct]: new Set([
    CorrelationName.Mills,
    CorrelationName.SiederTateLaminar,
    CorrelationName.FullyDevelopedUniformT,
    CorrelationName.FullyDevelopedUniformQ,
    CorrelationName.Transitional,
    CorrelationName.Gnielinski,
    CorrelationName.GnielinskiV2,
    CorrelationName.DittusBoelter,
    CorrelationName.SiederTateTurbulent,
    CorrelationName.Mikheev,
    CorrelationName.Petukhov,
    CorrelationName.WhitakerPipe,
    CorrelationName.SebanMcLaughlin,
    CorrelationName.WebbEckertGoldstein,
    CorrelationName.IsachenkoRoughness,
  ]),
  [CorrelationFamily.FlatPlate]: new Set([
    CorrelationName.FlatPlateLaminar,
    CorrelationName.FlatPlateTurbulent,
    CorrelationName.FlatPlateMixed,
    CorrelationName.ChurchillOzoe,
    CorrelationName.WhitakerFlatPlate,
  ]),
  [CorrelationFamily.Cylinder]: new Set([
    CorrelationName.ChurchillBernstein,
    CorrelationName.Hilpert,
    CorrelationName.WhitakerCylinder,
  ]),
  [CorrelationFamily.Sphere]: new Set([
    CorrelationName.SphereRanzMarshall,
    CorrelationName.SphereDiffusion,
    CorrelationName.WhitakerSphere,
  ]),
  [CorrelationFamily.TubeBank]: new Set([
    CorrelationName.Zukauskas,
    CorrelationName.WhitakerTubeBank,
  ]),
  [CorrelationFamily.NaturalConvection]: new Set([
    CorrelationName.ChurchillChu,
    CorrelationName.ChurchillChuLaminar,
    CorrelationName.ChurchillChuAllRa,
    CorrelationName.Morgan,
    CorrelationName.ChurchillChuHorizontal,
    CorrelationName.McAdamsHotUp,
    CorrelationName.McAdamsHotDown,
    CorrelationName.ChurchillInclined,
    CorrelationName.ChurchillSphereNatural,
    CorrelationName.RaithbyHollandsCylinders,
    CorrelationName.RaithbyHollandsSpheres,
    CorrelationName.Hollands,
    CorrelationName.GlobeDropkin,
    CorrelationName.MacGregorEmery,
    CorrelationName.MixedPowerSum,
  ]),
  [CorrelationFamily.Special]: new Set([
    CorrelationName.Gunn,
    CorrelationName.WakaoFunazkri,
    CorrelationName.WhitakerPackedBed,
    CorrelationName.NusseltCondensation,
    CorrelationName.ChenCondensation,
    CorrelationName.DorfmanDisk,
    CorrelationName.BjorklundKays,
    CorrelationName.MartinJetSingle,
    CorrelationName.MartinJetArray,
    CorrelationName.EllipticalCylinderOwen,
    CorrelationName.ConeYuge,
  ]),
};

/** Reverse lookup: CorrelationName → CorrelationFamily */
export const CORRELATION_NAME_TO_FAMILY: Readonly<Record<CorrelationName, CorrelationFamily>> =
  Object.fromEntries(
    (Object.entries(CORRELATION_FAMILY_MAP) as [CorrelationFamily, ReadonlySet<CorrelationName>][])
      .flatMap(([family, names]) => [...names].map(name => [name, family])),
  ) as Record<CorrelationName, CorrelationFamily>;

