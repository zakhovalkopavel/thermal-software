import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { STANDARD_CONDITIONS } from '../../../common/thermal/constants/standard-conditions.constants';
import { GasPropertiesService } from '../services/gas-properties.service';
import { TransportService } from '../services/transport.service';
import { DiffusionService } from '../services/diffusion.service';
import { GasMixtureInputDto } from '../dto/gas-properties/gas-mixture-input.dto';
import { GasPropertiesResultDto } from '../dto/gas-properties/gas-properties-result.dto';
import { CpComparisonEntryDto } from '../dto/gas-properties/cp-comparison-entry.dto';
import { Species } from '../enums/species.enum';

@ApiTags('thermodynamics')
@Controller('thermodynamics')
export class ThermodynamicsGasController {
  constructor(
    private readonly gasProps: GasPropertiesService,
    private readonly transport: TransportService,
    private readonly diffusion: DiffusionService,
  ) {}

  @Post('properties')
  @ApiOperation({ summary: 'Full thermophysical properties for a gas mixture' })
  @ApiBody({
    type: GasMixtureInputDto,
    examples: {
      air: {
        summary: 'Dry air at 800 K',
        value: { composition: { N2: 0.79, O2: 0.21 }, T_K: 800 },
      },
      flueGas: {
        summary: 'Flue gas at 1200 K, 1 atm',
        value: {
          composition: { N2: 0.72, CO2: 0.12, H2O: 0.10, O2: 0.06 },
          T_K: 1200,
        },
      },
    },
  })
  @ApiCreatedResponse({ type: GasPropertiesResultDto })
  getMixtureProperties(@Body() dto: GasMixtureInputDto): GasPropertiesResultDto {
    const { composition, T_K, P_atm = 1.0 } = dto;
    const mole   = composition as Partial<Record<Species, number>>;
    const P_Pa   = P_atm * STANDARD_CONDITIONS.PRESSURE_PA;
    const mu     = this.transport.viscosityMix(mole, T_K, P_Pa);
    const cpBySp = Object.fromEntries(
      (Object.keys(mole) as Species[]).map(sp => [sp, this.gasProps.cpSpecies(sp, T_K)]),
    ) as Partial<Record<Species, number>>;
    const lambda = this.transport.thermalConductivityMix(mole, T_K, cpBySp, P_Pa);
    const D      = this.diffusion.getAllDiffusionCoefficients(mole, T_K, P_atm);
    return this.gasProps.getFullMixtureProperties(mole, T_K, P_atm, mu, lambda, D);
  }

  @Get('cp-compare')
  @ApiOperation({
    summary: 'Compare all Cp approximations for a species at given T',
    description:
      'Returns one entry per registered equation type (polynomial, DIPPR 107, NASA-7, NASA-9, etc.) ' +
      'so you can compare accuracy across approximation methods at the same temperature.',
  })
  @ApiQuery({
    name: 'species',
    enum: Species,
    description: 'Gas species to compare. Note: "air" is a mixture alias — use GET /thermodynamics/fluid/cp instead.',
    example: Species.N2,
  })
  @ApiQuery({
    name: 'T_K',
    type: Number,
    description: 'Temperature [K] at which to evaluate Cp. Valid range depends on species data (typically 200–6000 K).',
    example: 1000,
  })
  @ApiOkResponse({ type: [CpComparisonEntryDto] })
  cpCompare(
    @Query('species') species: Species,
    @Query('T_K') T_K: string,
  ): CpComparisonEntryDto[] {
    return this.gasProps.cpCompare(species, parseFloat(T_K));
  }

}
