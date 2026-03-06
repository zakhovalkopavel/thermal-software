import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum WorkabilityEnum {
  FIRM = 'firm',
  STANDARD = 'standard',
  FLOWABLE = 'flowable',
}

export class WaterDemandDto {
  @ApiProperty({
    example: 0.74,
    description: 'Packing fraction φ (0–1)',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  packingFraction: number;

  @ApiProperty({
    example: 'STANDARD',
    enum: WorkabilityEnum,
    required: false,
    description: 'Workability level: FIRM (0.38), STANDARD (0.42, default), FLOWABLE (0.50)',
  })
  @IsEnum(WorkabilityEnum)
  @IsOptional()
  workability?: WorkabilityEnum;
}

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

