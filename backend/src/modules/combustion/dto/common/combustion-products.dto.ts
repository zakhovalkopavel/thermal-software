import { ApiProperty } from '@nestjs/swagger';
import { SpeciesValues } from '../../types';

export class CombustionProductsDto {
  @ApiProperty({ description: 'Species molar flows [mol/s]', type: 'object', additionalProperties: { type: 'number' } })
  moleFlows_mols: SpeciesValues;

  @ApiProperty({ description: 'Species mass flows [kg/s]', type: 'object', additionalProperties: { type: 'number' } })
  massFlows_kgs: SpeciesValues;

  @ApiProperty({ description: 'Gas mole fractions [-]', type: 'object', additionalProperties: { type: 'number' } })
  moleFractions: SpeciesValues;

  @ApiProperty({ description: 'Gas mass fractions [-]', type: 'object', additionalProperties: { type: 'number' } })
  massFractions: SpeciesValues;
}
