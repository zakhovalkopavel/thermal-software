import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompoundSearchHitDto {
  @ApiProperty({ description: 'Compound id (CAS or formula:…)', example: '124-38-9' })
  id: string;

  @ApiProperty({ description: 'Primary CAS, or null for formula-only records', nullable: true, example: '124-38-9' })
  cas: string | null;

  @ApiProperty({ example: 'carbon dioxide' })
  name: string;

  @ApiProperty({ description: 'Hill formula / lookup key', example: 'CO2' })
  formula: string;

  @ApiProperty({ example: 'CO2' })
  displayFormula: string;

  @ApiPropertyOptional({ type: [String], example: ['carbonic anhydride', 'dry ice'] })
  synonyms?: string[];

  @ApiPropertyOptional({ example: 'inorganic' })
  class?: string;

  @ApiPropertyOptional({ example: 'C' })
  group?: string;

  @ApiProperty({ description: 'Internal ranking score (higher is better)', example: 900 })
  score: number;
}
