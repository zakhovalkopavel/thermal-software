import { ApiPropertyOptional } from '@nestjs/swagger';

export class MaterialMechanicalPropertiesDto {
  @ApiPropertyOptional({ description: 'Cold crushing strength [MPa]' })
  crushingStrength_MPa?: number;

  @ApiPropertyOptional({ description: 'Modulus of rupture [MPa]' })
  modulusOfRupture_MPa?: number;

  @ApiPropertyOptional({ description: "Young's modulus [GPa]" })
  youngModulus_GPa?: number;

  @ApiPropertyOptional({ description: 'Vickers hardness [HV]' })
  hardness_HV?: number;
}
