import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/** CO — Carbon monoxide */
export const CO: CompoundValue = {
  name: 'Carbon monoxide',
  chemicalFormula: 'CO',
  Mr: 0.02801,
  enthalpyFormation298: -110.53e3,
  gibbsEnergy298: -137.17e3,
  collisionDiameter: 3.690,
  epsilonToKb: 91.7,
  /** ref: White3 — Sutherland parameters */
  sutherlandParams: { mu0: 1.657e-5, T0: 273, S: 136 },
  nasa7Key: 'CO',
  /** NASA RP-1311 set */
  nasa9Key: 'CO',
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 51,
        vars: { a: 29.108, b: -1.9816e-3, c: 4.0034e-6, d: -2.9872e-9, e: 7.0327e-13 },
        min: 50, max: 5000,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 28.16, b: 0.1675e-2, c: 0.5372e-5, d: -2.22e-9 },
        min: 273, max: 1800,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 455, k: 1e-6,
        vars: { a: 23.811, b: 5.3944e-1, c: -1.0983e-4 },
        min: 70, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Incropera, page: 838,
        vars: { a: 0.00158, b: 8.2511e-5, c: -1.9081e-8 },
        min: 70, max: 1500,
      },
    ],
  },
};

