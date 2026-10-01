import { ApiProperty } from '@nestjs/swagger';
import { DryingShrinkageDto } from './drying-shrinkage.dto';
import { FiringShrinkageDto } from './firing-shrinkage.dto';
import { ShrinkageMetadataDto } from './shrinkage-metadata.dto';
import { ShrinkageStageDto } from './shrinkage-stage.dto';

export class ShrinkageResultDto {
  @ApiProperty({ type: DryingShrinkageDto })
  drying: DryingShrinkageDto;

  @ApiProperty({ type: [FiringShrinkageDto], description: 'One entry per temperature' })
  firing: FiringShrinkageDto[];

  @ApiProperty({ type: ShrinkageStageDto })
  total: ShrinkageStageDto;

  @ApiProperty({ type: ShrinkageMetadataDto })
  metadata: ShrinkageMetadataDto;

  @ApiProperty({ type: [String] })
  warnings: string[];
}
