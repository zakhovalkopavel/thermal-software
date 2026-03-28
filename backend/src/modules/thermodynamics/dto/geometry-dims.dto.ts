import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GeometryDimsDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() a?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() b?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() c?: number;
  @ApiPropertyOptional({ description: 'Explicit characteristic length override [m]' })
  @IsOptional() @IsNumber() L?: number;
  @ApiPropertyOptional({ description: 'Porosity (packed bed)' })
  @IsOptional() @IsNumber() epsilon?: number;
  @ApiPropertyOptional({ description: 'Transverse pitch (tube bank) [m]' })
  @IsOptional() @IsNumber() S_T?: number;
  @ApiPropertyOptional({ description: 'Longitudinal pitch (tube bank) [m]' })
  @IsOptional() @IsNumber() S_L?: number;
  @ApiPropertyOptional({ description: 'Inclination from vertical [°]' })
  @IsOptional() @IsNumber() angle_deg?: number;
  @ApiPropertyOptional({ description: 'Angular velocity [rad/s]' })
  @IsOptional() @IsNumber() omega?: number;
  @ApiPropertyOptional({ description: 'Pipe/coil diameter (helical coil) [m]' })
  @IsOptional() @IsNumber() D?: number;
  @ApiPropertyOptional({ description: 'Coil diameter (helical coil) [m]' })
  @IsOptional() @IsNumber() D_c?: number;
  @ApiPropertyOptional({ description: 'Rib height (ribbed channel)' })
  @IsOptional() @IsNumber() e?: number;
  @ApiPropertyOptional({ description: 'Rib pitch (ribbed channel)' })
  @IsOptional() @IsNumber() p?: number;
  @ApiPropertyOptional({ description: 'Jet-to-surface spacing (impinging jet) [m]' })
  @IsOptional() @IsNumber() H?: number;
  @ApiPropertyOptional({ description: 'Radial distance from jet axis (impinging jet) [m]' })
  @IsOptional() @IsNumber() r?: number;
  @ApiPropertyOptional({ description: 'Nozzle diameter (impinging jet) [m]' })
  @IsOptional() @IsNumber() d_jet?: number;
  @ApiPropertyOptional({ description: 'Jet area fraction (impinging jet array)' })
  @IsOptional() @IsNumber() f_jet?: number;
}

