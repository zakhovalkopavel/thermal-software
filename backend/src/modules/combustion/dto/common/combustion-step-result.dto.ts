import { ApiProperty } from '@nestjs/swagger';
import { CombustionProductsDto } from './combustion-products.dto';

/** Result of one reacting step (fuel/gas + air → products at T_out) */
export class CombustionStepResultDto {
  @ApiProperty({ description: 'Outlet (flame) temperature [K]' })
  tOut_K: number;

  @ApiProperty({ description: 'Excess air ratio of the step: O2 supplied / O2 stoichiometric [-]' })
  excessAir: number;

  @ApiProperty({ type: CombustionProductsDto })
  products: CombustionProductsDto;

  @ApiProperty({ description: 'Gaseous products mass flow [kg/s]' })
  mGas_kgs: number;

  @ApiProperty({ description: 'Unburned carbon (char) mass flow [kg/s]' })
  charCarbon_kgs: number;

  @ApiProperty({ description: 'Ash mass flow [kg/s]' })
  ash_kgs: number;

  @ApiProperty({ description: 'Absolute enthalpy flow of reactants [W]' })
  reactantEnthalpy_W: number;

  @ApiProperty({ description: 'Absolute enthalpy flow of products at T_out [W]' })
  productEnthalpy_W: number;

  @ApiProperty({ description: 'Heat removed by walls [W]' })
  heatLoss_W: number;

  @ApiProperty({ description: 'Water-gas shift Kp at T_out (null for lean/complete combustion)', nullable: true, type: Number })
  wgsKp: number | null;

  @ApiProperty({ description: 'Largest relative C/H/O/N/S mismatch between reactants and products' })
  elementBalanceResidual: number;
}
