import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GeometryDimsDto {
  @ApiPropertyOptional({
    description:
      'Primary characteristic dimension [m]. ' +
      'Pipe/cylinder inner diameter; sphere or particle diameter; ' +
      'square/equilateral-duct side; annulus inner diameter; rotating body radius. ' +
      'Must be > 0.',
    minimum: 0,
    exclusiveMinimum: true,
    example: 0.05,
  })
  @IsOptional() @IsNumber() a?: number;

  @ApiPropertyOptional({
    description:
      'Secondary dimension [m]. ' +
      'Annulus outer diameter; rectangular/elliptical duct height; ' +
      'vertical plate/cylinder height for natural convection; ' +
      'concentric-sphere/cylinder outer radius.',
    minimum: 0,
    exclusiveMinimum: true,
    example: 0.1,
  })
  @IsOptional() @IsNumber() b?: number;

  @ApiPropertyOptional({
    description:
      'Tertiary dimension [m]. ' +
      'Flat-plate streamwise length; third side of trapezoidal/scalene-triangular duct.',
    minimum: 0,
    exclusiveMinimum: true,
    example: 0.5,
  })
  @IsOptional() @IsNumber() c?: number;

  @ApiPropertyOptional({ description: 'Explicit characteristic length override [m] — bypasses geometry-based L calculation' })
  @IsOptional() @IsNumber() L?: number;

  @ApiPropertyOptional({ description: 'Void fraction / porosity of packed bed (0 < ε < 1)', minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() epsilon?: number;

  @ApiPropertyOptional({ description: 'Transverse pitch between tube-bank rows [m]' })
  @IsOptional() @IsNumber() S_T?: number;

  @ApiPropertyOptional({ description: 'Longitudinal pitch between tube-bank columns [m]' })
  @IsOptional() @IsNumber() S_L?: number;

  @ApiPropertyOptional({ description: 'Inclination angle from vertical for inclined plates [°], default 0' })
  @IsOptional() @IsNumber() angle_deg?: number;

  @ApiPropertyOptional({ description: 'Angular velocity of rotating disk/cylinder [rad/s]' })
  @IsOptional() @IsNumber() omega?: number;

  @ApiPropertyOptional({ description: 'Pipe or tube diameter inside a helical coil [m]' })
  @IsOptional() @IsNumber() D?: number;

  @ApiPropertyOptional({ description: 'Coil centreline diameter for helical coil [m]' })
  @IsOptional() @IsNumber() D_c?: number;

  @ApiPropertyOptional({ description: 'Rib height for ribbed channel [m]' })
  @IsOptional() @IsNumber() e?: number;

  @ApiPropertyOptional({ description: 'Rib-to-rib pitch for ribbed channel [m]' })
  @IsOptional() @IsNumber() p?: number;

  @ApiPropertyOptional({ description: 'Jet-to-surface spacing for impinging jet [m]' })
  @IsOptional() @IsNumber() H?: number;

  @ApiPropertyOptional({ description: 'Radial distance from jet axis for impinging jet [m]' })
  @IsOptional() @IsNumber() r?: number;

  @ApiPropertyOptional({ description: 'Nozzle diameter for impinging jet [m]' })
  @IsOptional() @IsNumber() d_jet?: number;

  @ApiPropertyOptional({ description: 'Jet area fraction for impinging jet array (0 < f_jet < 1)' })
  @IsOptional() @IsNumber() f_jet?: number;
}
