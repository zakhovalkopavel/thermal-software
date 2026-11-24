import { ApiProperty } from '@nestjs/swagger';

export class FluidListEntryDto {
  @ApiProperty({ description: 'Fluid key accepted as `fluid` in requests', example: 'N2' }) key: string;
  @ApiProperty({ description: 'Display name', example: 'Nitrogen' }) name: string;
  @ApiProperty({ description: 'Chemical formula (null for mixtures)', nullable: true, type: String, example: 'N2' }) formula: string | null;
  @ApiProperty({ description: 'Molar mass [kg/mol] (null for a custom mixture)', nullable: true, type: Number, example: 0.028014 }) Mr_kg_mol: number | null;
}
