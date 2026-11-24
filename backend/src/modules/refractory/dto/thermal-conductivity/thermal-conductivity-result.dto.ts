import { ApiProperty } from '@nestjs/swagger';
import { ThermalConductivityComponentsDto } from './thermal-conductivity-components.dto';

export class ThermalConductivityResultDto {
  @ApiProperty()
  thermalConductivity_WmK: number;

  @ApiProperty()
  specificHeat_JkgK: number;

  @ApiProperty()
  density_kgm3: number;

  @ApiProperty()
  thermalDiffusivity_m2s: number;

  @ApiProperty()
  temperature_C: number;

  @ApiProperty({ description: 'Porosity (0–1)' })
  porosity: number;

  @ApiProperty({ type: ThermalConductivityComponentsDto })
  components: ThermalConductivityComponentsDto;
}
