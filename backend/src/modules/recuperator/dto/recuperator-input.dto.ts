import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { HoleForm } from '../enums/hole-form.enum';

export class RecuperatorInputDto {
  /** Furnace power [W] */
  @IsNumber() @Min(0) fPower_W: number;

  /** Lower heating value of fuel [J/kg] */
  @IsNumber() @Min(1) fuelQ_Jkg: number;

  /** Excess air ratio */
  @IsNumber() @Min(0.01) kExcessAir: number;

  /** Inlet air temperature [K] */
  @IsNumber() @Min(200) tAirStart_K: number;

  /** Channel geometry form */
  @IsEnum(HoleForm) holeForm: HoleForm;

  /** Nominal channel dimension [m] */
  @IsNumber() @Min(0.001) d0_m: number;

  /** Air annular depth [m] — CIRCLE_IN_RING only */
  @IsOptional() @IsNumber() @Min(0) h0_m?: number;

  /** Refractory wall thickness between smoke and air [m] */
  @IsNumber() @Min(0.001) refractoryThickness_m: number;

  /** Number of air channels */
  @IsNumber() @Min(1) nAir: number;

  /** Number of smoke channels */
  @IsNumber() @Min(1) nSmoke: number;

  /** Number of air passes — CIRCLE_IN_RING only (default 1) */
  @IsOptional() @IsNumber() @Min(1) nPasses?: number;

  /** Enable smoke turbulence model (default false) */
  @IsOptional() @IsBoolean() smokeTurbulence?: boolean;

  /** Target recuperator length [m] */
  @IsNumber() @Min(0.1) wantedRecuperatorLength_m: number;

  /** Outer thermal insulation thickness [m] */
  @IsNumber() @Min(0) thermalInsulationThickness_m: number;

  /** Refractory wall thermal conductivity [W/(m·K)] */
  @IsNumber() @Min(0.01) refractoryLambda_WmK: number;

  /** Refractory wall emissivity */
  @IsNumber() @Min(0) refractoryEmissivity: number;

  /** Outer surface emissivity */
  @IsNumber() @Min(0) surfaceEmissivity: number;

  /** Outer surface area [m²] for thermal loss calculation */
  @IsNumber() @Min(0) surfaceArea_m2: number;

  /** Water mass fraction in air — humidity (default 0) */
  @IsOptional() @IsNumber() @Min(0) wH2Om?: number;

  /** Air preheat offset [K] for maximum flame temp calculation (default 0) */
  @IsOptional() @IsNumber() airPreheat_K?: number;

  /** O₂ vol fraction in dry air (default 0.21) */
  @IsOptional() @IsNumber() pO2?: number;
}
