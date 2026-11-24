import { ElementFlows } from '../../types';

/** O2 needed for complete combustion to CO2, H2O, SO2, net of the O already bound [mol/s] */
export function stoichiometricO2(el: ElementFlows): number {
  return el.C + el.H / 4 + el.S - el.O / 2;
}
