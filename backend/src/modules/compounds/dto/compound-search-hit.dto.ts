import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompoundSearchHitDto {
  @ApiProperty({
    description:
      'Public compound id: compound name with spaces as `_`; `_1`/`_2`/… when names collide. Prefer over `id`.',
    example: 'carbon_dioxide',
  })
  compoundId: string;

  @ApiProperty({
    description: 'Deprecated alias of `compoundId`',
    example: 'carbon_dioxide',
    deprecated: true,
  })
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
