import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CompoundIdParamDto {
  @ApiProperty({
    description: 'Public compoundId (name with spaces as `_`; `_1`/`_2`/… on collisions), or a CAS',
    example: 'water',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  id: string;
}
