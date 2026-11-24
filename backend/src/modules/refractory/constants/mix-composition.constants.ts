import { MaterialGroup } from '../enums/material-group.enum';
import { NonOxideComponentGroup } from '../enums/non-oxide-component-group.enum';

/**
 * Key classification for `POST /refractory/mix/composition`.
 * Classes are applied in this order (first match wins):
 * loss on ignition → accepted oxide → other oxide → metal impurity → carbon → non-oxide.
 */
export const MIX_COMPOSITION_CONSTANTS = {
  /** Removed on firing */
  lossOnIgnitionKeys: ['H2O', 'CO2', 'OH', 'Organic'] as ReadonlyArray<string>,

  /** Fields of OxideCompositionDto — the only oxides accepted by the chemical endpoints */
  acceptedOxideKeys: ['SiO2', 'Al2O3', 'CaO', 'MgO', 'Fe2O3', 'K2O', 'Na2O', 'TiO2'] as ReadonlyArray<string>,

  /** One or more elements followed by O and an optional count: B2O3, FeO, SO3, Pr6O11, … */
  oxideKeyPattern: /^(?:[A-Z][a-z]?\d*)+O\d*$/,

  /** Elemental metal keys treated as impurities when below the threshold */
  metalElementKeys: ['Fe', 'Ti', 'Si', 'Al', 'Ca', 'Mg', 'Na', 'K', 'Mn', 'Zr', 'La', 'Cr'] as ReadonlyArray<string>,

  /** wt% of its own material below which a metal key is dropped */
  metalImpurityThreshold_wt: 1,

  carbonKey: 'C',

  /** Non-oxide bucket by the material's primary group; any other group → OTHER */
  nonOxidePrimaryGroups: {
    [MaterialGroup.CARBIDE]: NonOxideComponentGroup.CARBIDE,
    [MaterialGroup.NITRIDE]: NonOxideComponentGroup.NITRIDE,
  } as Readonly<Partial<Record<MaterialGroup, NonOxideComponentGroup>>>,

  /** Other oxides + non-oxides above this share of fired mass [wt%] raise a reliability warning */
  reliabilityWarningThreshold_wt: 5,
} as const;
