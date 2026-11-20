/**
 * Optional model override for glass viscosity endpoints.
 * When omitted the service auto-selects the best model for the composition.
 * If the requested model is out of range, the best valid model is used instead
 * (the response will indicate which model was actually applied).
 *
 * Swagger / request body values must stay identical to the former DTO-local enum.
 */
export enum GlassViscosityModelDto {
  LAKATOS_1976      = 'LAKATOS_1976',
  FLUEGEL_2007      = 'FLUEGEL_2007',
  HETHERINGTON_1964 = 'HETHERINGTON_1964',
}
