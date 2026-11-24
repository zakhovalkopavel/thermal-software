import { ApiProperty } from '@nestjs/swagger';
import { SpeciesValues } from '../../types';
import { ReactionExtentsDto } from './reaction-extents.dto';

export class BedLayerResultDto {
  @ApiProperty() index: number;
  @ApiProperty({ description: 'Layer centre height above the grate [m]' }) z_m: number;
  @ApiProperty({ description: 'Gas temperature at layer outlet [K]' }) tGas_K: number;
  @ApiProperty({ description: 'Char surface temperature [K]' }) tSolid_K: number;
  @ApiProperty({ description: 'Gas temperature change in the layer [K]' }) deltaT_K: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Outlet mole fractions' })
  moleFractions: SpeciesValues;
  @ApiProperty({ description: 'Carbon gasified in the layer [kg/s]' }) carbonBurnRate_kgs: number;
  @ApiProperty({ description: 'Fuel consumed in the layer [kg/s]' }) fuelBurnRate_kgs: number;
  @ApiProperty({ description: 'Carbon burn rate per external char surface [g/(s·cm²)]' }) burnRatePerArea_g_s_cm2: number;
  @ApiProperty({ type: ReactionExtentsDto, description: 'Reaction extents [mol/s]' }) extents: ReactionExtentsDto;
  @ApiProperty({ description: 'Wall heat loss [W]' }) wallLoss_W: number;
  @ApiProperty({ description: 'Inner wall temperature [K] (null when adiabatic)', nullable: true, type: Number }) tWallInner_K: number | null;
  @ApiProperty({ description: 'Outer wall temperature [K] (null when adiabatic)', nullable: true, type: Number }) tWallOuter_K: number | null;
  @ApiProperty({ description: 'Gas–particle heat transfer coefficient [W/(m²·K)]' }) hConv_Wm2K: number;
  @ApiProperty({ description: 'Superficial gas velocity [m/s]' }) velocity_ms: number;
  @ApiProperty({ description: 'Pressure drop of the layer [Pa]' }) pressureDrop_Pa: number;
  @ApiProperty() D_O2_m2s: number;
  @ApiProperty() D_CO2_m2s: number;
  @ApiProperty() D_H2O_m2s: number;
  @ApiProperty({ description: 'Steam injected at the outlet of this layer' }) steamInjected: boolean;
}
