import { IsArray, IsEnum, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WallGeometry } from '../enums/wall-geometry.enum';
import { LayerDto } from './layer.dto';
import { SmokeCompositionDto } from './smoke-composition.dto';

export class MultilayerWallInputDto {
  /** Wall geometry */
  @IsEnum(WallGeometry)
  geometry: WallGeometry;

  /** Inner dimension [m] — cylinder/sphere inner diameter, flat-wall half-thickness */
  @IsNumber() @Min(0.001)
  a_m: number;

  /** Second dimension [m] — cylinder length; flat-wall width */
  @IsOptional() @IsNumber() @Min(0)
  b_m?: number;

  /** Wall layers from inside to outside */
  @IsArray() @ValidateNested({ each: true }) @Type(() => LayerDto)
  layers: LayerDto[];

  /** Gas velocity inside [m/s] */
  @IsNumber() @Min(0)
  w_ms: number;

  /** Gas composition (mole fractions) */
  @ValidateNested() @Type(() => SmokeCompositionDto)
  composition: SmokeCompositionDto;

  /** Gas mass flow [kg/s] */
  @IsNumber() @Min(0)
  mPerSecond_kgs: number;

  /** Flame / hot gas temperature [K] */
  @IsNumber() @Min(300)
  tFlame_K: number;

  /** Ambient temperature [K] */
  @IsNumber() @Min(200)
  tAmbient_K: number;

  /** Inner surface emissivity */
  @IsNumber() @Min(0)
  innerEmissivity: number;

  /** Number of finite-difference steps through wall (default 50) */
  @IsOptional() @IsNumber() @Min(5)
  numberOfSteps?: number;

  /** Convergence criterion for binary search (default 0.001) */
  @IsOptional() @IsNumber() @Min(1e-6)
  endFactor?: number;
}
