import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RefractoryThermalMaterial } from '../../refractory/enums/refractory-thermal-material.enum';
import { WallMaterialKey } from '../types/wall-material-key.type';

export class LayerDto {
  @ApiProperty({
    description: 'Material key — any RefractoryThermalMaterial or MetalMaterial value',
    example: RefractoryThermalMaterial.CHAMOTTE_SOLID,
  })
  @IsString()
  material: WallMaterialKey;

  @ApiProperty({ description: 'Layer thickness [mm]', example: 200, minimum: 0.1 })
  @IsNumber() @Min(0.1)
  thicknessMm: number;
}
