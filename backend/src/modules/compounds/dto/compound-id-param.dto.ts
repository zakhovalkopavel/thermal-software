import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CompoundIdParamDto {
  @ApiProperty({ description: 'Compound id (CAS or formula:…)', example: '124-38-9' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  id: string;
}
