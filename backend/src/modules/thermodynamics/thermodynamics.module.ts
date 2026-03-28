import { Module } from '@nestjs/common';
import { ThermodynamicsController } from './controllers/thermodynamics.controller';
import { NumericController } from './controllers/numeric.controller';
import { GasPropertiesService } from './services/gas-properties.service';
import { TransportService } from './services/transport.service';
import { DiffusionService } from './services/diffusion.service';
import { DimensionlessNumbersService } from './services/dimensionless-numbers.service';
import { DimensionlessCalculationService } from './services/dimensionless-calculation.service';
import { AerodynamicsService } from './services/aerodynamics.service';

@Module({
  controllers: [ThermodynamicsController, NumericController],
  providers: [
    GasPropertiesService,
    TransportService,
    DiffusionService,
    DimensionlessNumbersService,
    DimensionlessCalculationService,
    AerodynamicsService,
  ],
  exports: [
    GasPropertiesService,
    TransportService,
    DiffusionService,
    DimensionlessNumbersService,
    DimensionlessCalculationService,
    AerodynamicsService,
  ],
})
export class ThermodynamicsModule {}

