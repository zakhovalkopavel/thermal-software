export interface GasMoleFractions {
  N2:  number;
  O2:  number;
  CO2: number;
  CO:  number;
  H2O: number;
  H2:  number;
}

export class CombustionResultDto {
  /** Adiabatic flame temperature [K] */
  tFlame_K: number;

  /** Smoke temperature entering recuperator [K] */
  tSmokeStart_K: number;

  /** Fuel mass flow rate [kg/s] */
  mFuel_kgs: number;

  /** Air mass flow rate [kg/s] */
  mAir_kgs: number;

  /** Flue gas mass flow rate [kg/s] */
  mSmoke_kgs: number;

  composition: {
    /** Air mole fractions before combustion */
    before: GasMoleFractions;
    /** Flue gas mole fractions after combustion */
    after:  GasMoleFractions;
  };

  /** CO₂ mole fraction in flue gas */
  pCO2: number;

  /** H₂O mole fraction in flue gas */
  pH2O: number;
}
