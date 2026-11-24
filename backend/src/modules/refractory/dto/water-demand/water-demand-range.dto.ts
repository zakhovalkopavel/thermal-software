import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Water-demand range (firm / standard / flowable) at a packing fraction. */
export class WaterDemandRangeDto {
  @ApiProperty({
    example: 0.74,
    description: 'Packing fraction φ (0–1)',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  packingFraction: number;
}
