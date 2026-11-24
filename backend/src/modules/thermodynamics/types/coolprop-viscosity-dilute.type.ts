/** CoolProp dilute η₀ model (coefficient forms we evaluate). */
export type CoolpropViscosityDilute =
  | {
      type: 'collision_integral';
      C: number;
      a: number[];
      t: number[];
      molar_mass: number;
    }
  | {
      type: 'powers_of_T';
      a: number[];
      t: number[];
    }
  | {
      type: 'powers_of_Tr';
      T_reducing: number;
      a: number[];
      t: number[];
    };
