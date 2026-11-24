import { ApiProperty } from '@nestjs/swagger';
import { GostRefractorinessResultDto } from './gost-refractoriness-result.dto';
import { PceModifiedResultDto } from './pce-modified-result.dto';
import { PceResultDto } from './pce-result.dto';
import { RefractorinessComponentsDto } from './refractoriness-components.dto';
import { RulResultDto } from './rul-result.dto';

export class RefractorinessResultDto {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Input composition, echoed' })
  composition: Record<string, number>;

  @ApiProperty({ example: 'ISO1893' })
  standard: string;

  @ApiProperty()
  estimatedRefractoriness_C: number;

  @ApiProperty({ type: RefractorinessComponentsDto })
  components: RefractorinessComponentsDto;

  @ApiProperty({ type: RulResultDto, required: false, description: 'Present for ISO1893' })
  RUL?: RulResultDto;

  @ApiProperty({ type: PceResultDto, required: false, description: 'Present for ASTM_C24' })
  PCE?: PceResultDto;

  @ApiProperty({ type: PceModifiedResultDto, required: false, description: 'Present for ASTM_C71' })
  PCE_modified?: PceModifiedResultDto;

  @ApiProperty({ type: GostRefractorinessResultDto, required: false, description: 'Present for GOST4069' })
  GOST?: GostRefractorinessResultDto;

  @ApiProperty({ example: 'High duty refractory' })
  classification: string;
}
