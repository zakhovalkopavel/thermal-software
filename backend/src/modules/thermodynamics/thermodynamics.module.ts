import { Module } from '@nestjs/common';
import { ThermodynamicsController } from './controllers/thermodynamics.controller';
import { GasPropertiesService } from './services/gas-properties.service';
import { TransportService } from './services/transport.service';
import { DiffusionService } from './services/diffusion.service';
import { DimensionlessNumbersService } from './services/dimensionless-numbers.service';
import { AerodynamicsService } from './services/aerodynamics.service';

@Module({
  controllers: [ThermodynamicsController],
  providers: [
    GasPropertiesService,
    TransportService,
    DiffusionService,
    DimensionlessNumbersService,
    AerodynamicsService,
  ],
  exports: [
    GasPropertiesService,
    TransportService,
    DiffusionService,
    DimensionlessNumbersService,
    AerodynamicsService,
  ],
})
export class ThermodynamicsModule {}

