import type { CombustionResponse } from '../../../types/combustion-response.type';
import type { CombustionSummary } from '../types/combustion-summary.type';

const GENERATOR = 'Generator gas';
const BURNOUT = 'After burnout';
const PRODUCTS = 'Products';

export function toCombustionSummary(response: CombustionResponse): CombustionSummary {
  switch (response.mode) {
    case 'solid-direct':
    case 'fluid': {
      const { result } = response;
      return {
        fuel: result.fuel,
        mFuel_kgs: result.mFuel_kgs,
        fPower_W: result.fPower_W,
        tFlame_K: result.tFlame_K,
        feeds: [{ label: 'Air', kgs: result.mAir_kgs }],
        steps: [{ key: 'combustion', label: PRODUCTS, result: result.combustion }],
        lastStep: result.combustion,
        compositions: [{ label: PRODUCTS, moleFractions: result.combustion.products.moleFractions }],
        details: [{ label: 'Excess air', value: result.combustion.excessAir }],
      };
    }
    case 'solid-two-step': {
      const { result } = response;
      return {
        fuel: result.fuel,
        mFuel_kgs: result.mFuel_kgs,
        fPower_W: result.fPower_W,
        tFlame_K: result.tFlame_K,
        tStep1_K: result.tStep1_K,
        feeds: [
          { label: 'Primary air', kgs: result.mAirPrimary_kgs },
          { label: 'Secondary air', kgs: result.mAirSecondary_kgs },
        ],
        steps: [
          { key: 'generator', label: GENERATOR, result: result.generator },
          { key: 'burnout', label: BURNOUT, result: result.burnout },
        ],
        lastStep: result.burnout,
        compositions: [
          { label: GENERATOR, moleFractions: result.generator.products.moleFractions },
          { label: BURNOUT, moleFractions: result.burnout.products.moleFractions },
        ],
        details: [{ label: 'Primary excess air', value: result.primaryExcessAir }],
      };
    }
    case 'bed': {
      const { result } = response;
      return {
        fuel: result.fuel,
        mFuel_kgs: result.mFuel_kgs,
        fPower_W: result.fPower_W,
        tFlame_K: result.tFlame_K,
        tStep1_K: result.tStep1_K,
        feeds: [
          { label: 'Primary air', kgs: result.mAirPrimary_kgs },
          { label: 'Steam', kgs: result.mSteam_kgs },
          { label: 'Secondary air', kgs: result.mAirSecondary_kgs },
        ],
        steps: [{ key: 'burnout', label: BURNOUT, result: result.burnout }],
        lastStep: result.burnout,
        compositions: [
          { label: GENERATOR, moleFractions: result.generatorGasMoleFractions },
          { label: BURNOUT, moleFractions: result.burnout.products.moleFractions },
        ],
        details: [
          { label: 'Primary excess air', value: result.primaryExcessAir },
          { label: 'Generator gas', value: result.mGeneratorGas_kgs, unit: 'kg/s' },
          { label: 'Carbon burn rate', value: result.carbonBurnRate_kgs, unit: 'kg/s' },
          { label: 'Generator heat loss', value: result.generatorHeatLoss_W, unit: 'W' },
          { label: 'Bed pressure drop', value: result.pressureDrop_Pa, unit: 'Pa' },
          { label: 'Oxidation zone height', value: result.oxidationZoneHeight_m, unit: 'm' },
          { label: 'Energy balance residual', value: result.energyBalanceResidual_W, unit: 'W' },
        ],
        layers: result.layers,
      };
    }
  }
}
