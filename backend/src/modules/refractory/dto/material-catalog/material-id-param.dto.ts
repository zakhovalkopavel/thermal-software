import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MaterialIdParamDto {
  @ApiProperty({ example: 'alumina_tabular' })
  @IsString()
  @IsNotEmpty()
  materialId: string;
}
