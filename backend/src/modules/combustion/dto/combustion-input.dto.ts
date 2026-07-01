import { IsNumber, IsOptional, Min } from 'class-validator';

export class CombustionInputDto {
  /** Furnace power [W] */
  @IsNumber() @Min(0)
  fPower_W: number;

  /** Lower heating value of fuel [J/kg] */
  @IsNumber() @Min(1)
  fuelQ_Jkg: number;

  /** Carbon-equivalent LHV [J/kg] — default 32 900 000 */
  @IsOptional() @IsNumber() @Min(1)
  carbonQ_Jkg?: number;

  /** Excess air ratio (1.0 = stoichiometric, typical 1.2–1.5) */
  @IsNumber() @Min(0.01)
  kExcessAir: number;

  /** Inlet air / initial gas temperature [K] */
  @IsNumber() @Min(200)
  tAirStart_K: number;

  /** O₂ vol fraction in dry air (default 0.21) */
  @IsOptional() @IsNumber() @Min(0.01)
  pO2?: number;

  /** Water mass fraction in air — humidity (default 0) */
  @IsOptional() @IsNumber() @Min(0)
  wH2Om?: number;

  /** Generator surface heat loss [W] (default 0) */
  @IsOptional() @IsNumber() @Min(0)
  generatorHeatLoss_W?: number;
}
