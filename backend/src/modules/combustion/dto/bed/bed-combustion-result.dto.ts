import { ApiProperty } from '@nestjs/swagger';
import { FuelSummaryDto, CombustionStepResultDto } from '../common';
import { SpeciesValues } from '../../types';
import { BedLayerResultDto } from './bed-layer-result.dto';

export class BedCombustionResultDto {
  @ApiProperty({ type: FuelSummaryDto }) fuel: FuelSummaryDto;
  @ApiProperty({ type: [BedLayerResultDto] }) layers: BedLayerResultDto[];
  @ApiProperty({ description: 'Fuel burned in the bed [kg/s]' }) mFuel_kgs: number;
  @ApiProperty({ description: 'Fuel power of the burned fuel, LHV basis [W]' }) fPower_W: number;
  @ApiProperty({ description: 'Carbon gasified [kg/s]' }) carbonBurnRate_kgs: number;
  @ApiProperty({ description: 'Ash released [kg/s]' }) ash_kgs: number;
  @ApiProperty({ description: 'Primary air incl. humidity [kg/s]' }) mAirPrimary_kgs: number;
  @ApiProperty({ description: 'Steam injected [kg/s]' }) mSteam_kgs: number;
  @ApiProperty({ description: 'Secondary air incl. humidity [kg/s]' }) mAirSecondary_kgs: number;
  @ApiProperty({ description: 'Excess air of the primary air relative to the burned fuel [-]' }) primaryExcessAir: number;
  @ApiProperty({ description: 'Generator wall heat loss [W]' }) generatorHeatLoss_W: number;
  @ApiProperty({ description: 'Bed pressure drop [Pa]' }) pressureDrop_Pa: number;
  @ApiProperty({ description: 'Top of the oxidation zone (CO < 1 %, O₂ > 1 %) [m]', nullable: true, type: Number })
  oxidationZoneHeight_m: number | null;
  @ApiProperty({ description: 'Generator gas temperature at the bed outlet [K]' }) tStep1_K: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Generator gas mole flows [mol/s]' })
  generatorGasMoleFlows_mols: SpeciesValues;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Generator gas mole fractions' })
  generatorGasMoleFractions: SpeciesValues;
  @ApiProperty({ description: 'Generator gas mass flow [kg/s]' }) mGeneratorGas_kgs: number;
  @ApiProperty({ description: 'Largest relative element mismatch over the bed' }) elementBalanceResidual: number;
  @ApiProperty({ description: 'Bed energy balance residual [W]' }) energyBalanceResidual_W: number;
  @ApiProperty({ description: 'Flame temperature after secondary air [K]' }) tFlame_K: number;
  @ApiProperty({ type: CombustionStepResultDto, description: 'Burnout step (generator gas + secondary air)' })
  burnout: CombustionStepResultDto;
}
