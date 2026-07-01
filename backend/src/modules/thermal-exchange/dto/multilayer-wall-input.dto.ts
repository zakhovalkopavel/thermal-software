import { IsArray, IsEnum, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WallGeometry } from '../enums/wall-geometry.enum';
import { LayerDto } from './layer.dto';
import { SmokeCompositionDto } from './smoke-composition.dto';

export class MultilayerWallInputDto {
  @ApiProperty({ enum: WallGeometry, description: 'Wall geometry', example: WallGeometry.FLAT })
  @IsEnum(WallGeometry)
  geometry: WallGeometry;

  @ApiProperty({ description: 'Inner dimension [m] — cylinder inner radius, flat-wall half-width', example: 0.5, minimum: 0.001 })
  @IsNumber() @Min(0.001)
  a_m: number;

  @ApiPropertyOptional({ description: 'Second dimension [m] — cylinder length or flat-wall width', example: 2.0, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  b_m?: number;

  @ApiProperty({
    description: 'Wall layers from inside to outside',
    type: [LayerDto],
    example: [
      { material: 'chamotte_solid', thicknessMm: 200 },
      { material: 'chamotte_600',   thicknessMm: 100 },
    ],
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => LayerDto)
  layers: LayerDto[];

  @ApiProperty({ description: 'Hot gas velocity [m/s]', example: 4, minimum: 0 })
  @IsNumber() @Min(0)
  w_ms: number;

  @ApiProperty({
    description: 'Gas composition (mole fractions)',
    type: SmokeCompositionDto,
    example: { N2: 0.72, O2: 0.02, CO2: 0.13, CO: 0, H2O: 0.13, H2: 0 },
  })
  @ValidateNested() @Type(() => SmokeCompositionDto)
  composition: SmokeCompositionDto;

  @ApiProperty({ description: 'Gas mass flow [kg/s]', example: 0.5, minimum: 0 })
  @IsNumber() @Min(0)
  mPerSecond_kgs: number;

  @ApiProperty({ description: 'Flame / hot gas temperature [K]', example: 1473, minimum: 300 })
  @IsNumber() @Min(300)
  tFlame_K: number;

  @ApiProperty({ description: 'Ambient temperature [K]', example: 293, minimum: 200 })
  @IsNumber() @Min(200)
  tAmbient_K: number;

  @ApiProperty({ description: 'Inner surface emissivity [0–1]', example: 0.85, minimum: 0 })
  @IsNumber() @Min(0)
  innerEmissivity: number;

  @ApiPropertyOptional({ description: 'FD steps through wall (default 50)', example: 50, minimum: 5 })
  @IsOptional() @IsNumber() @Min(5)
  numberOfSteps?: number;

  @ApiPropertyOptional({ description: 'Convergence criterion for binary search (default 0.001)', example: 0.001, minimum: 1e-6 })
  @IsOptional() @IsNumber() @Min(1e-6)
  endFactor?: number;
}
