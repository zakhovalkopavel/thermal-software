import { ApiProperty } from '@nestjs/swagger';
import { ViscosityModel, ViscosityModelType } from '../../../enums/viscosity-model.enum';
import { ViscosityModelParametersDto } from './viscosity-model-parameters.dto';

export class ViscosityModelInfoDto {
  @ApiProperty({ enum: ViscosityModelType })
  type: ViscosityModelType;

  @ApiProperty({ enum: ViscosityModel })
  systemType: ViscosityModel;

  @ApiProperty()
  systemName: string;

  @ApiProperty({ type: ViscosityModelParametersDto })
  parameters: ViscosityModelParametersDto;
}
