import { ApiProperty } from '@nestjs/swagger';

export class GostRefractorinessResultDto {
  @ApiProperty()
  refractorinessPoint_C: number;

  @ApiProperty()
  coneSoftening: boolean;

  @ApiProperty()
  description: string;
}
