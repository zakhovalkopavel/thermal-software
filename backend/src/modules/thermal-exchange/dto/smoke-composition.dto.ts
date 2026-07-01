import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class SmokeCompositionDto {
  @IsNumber() @Min(0) @Max(1) N2:  number;
  @IsNumber() @Min(0) @Max(1) O2:  number;
  @IsNumber() @Min(0) @Max(1) CO2: number;
  @IsNumber() @Min(0) @Max(1) CO:  number;
  @IsNumber() @Min(0) @Max(1) H2O: number;
  @IsNumber() @Min(0) @Max(1) H2:  number;
}
