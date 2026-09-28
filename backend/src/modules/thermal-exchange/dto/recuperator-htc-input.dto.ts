import { IsNumber, IsOptional, Min } from 'class-validator';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SmokeCompositionDto } from './smoke-composition.dto';

export class RecuperatorHtcInputDto {
  // ── Smoke side ────────────────────────────────────────────────────────────
  @IsNumber() tSmoke_K: number;
  @IsNumber() @Min(0) wSmoke_ms: number;
  @ValidateNested() @Type(() => SmokeCompositionDto)
  smokeComposition: SmokeCompositionDto;
  @IsNumber() @Min(0.001) dSmoke_m: number;
  @IsNumber() @Min(0.001) lSmoke_m: number;
  @IsNumber() @Min(0.001) rayLengthSmoke_m: number;
  @IsNumber() @Min(0) smokeEmissivity: number;

  // ── Air side ─────────────────────────────────────────────────────────────
  @IsNumber() tAir_K: number;
  @IsNumber() @Min(0) wAir_ms: number;
  @IsNumber() @Min(0.001) dAir_m: number;
  @IsNumber() @Min(0.001) lAir_m: number;
  @IsNumber() @Min(0.001) rayLengthAir_m: number;
  @IsNumber() @Min(0) airEmissivity: number;

  /**
   * Air-channel gas composition (mole fractions, must sum to ≈ 1).
   * Omit for pure dry air (N₂ = 0.79, O₂ = 0.21).
   * Supply when preheated air carries steam (air+H₂O) or is partially
   * mixed with flue gas (air+smoke).
   */
  @IsOptional()
  @ValidateNested() @Type(() => SmokeCompositionDto)
  airComposition?: SmokeCompositionDto;

  // ── Wall ─────────────────────────────────────────────────────────────────
  @IsNumber() @Min(0) wallThickness_m: number;
  @IsNumber() @Min(0.001) wallLambda_WmK: number;

  /** Recuperator length for entrance-effect correction [m] */
  @IsNumber() @Min(0.001) length_m: number;

  /** Double effective Re for smoke (turbulence model) */
  @IsOptional()
  enableSmokeTurbulence?: boolean;
}
