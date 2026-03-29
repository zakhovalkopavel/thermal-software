import { Module } from '@nestjs/common';
import { ThermodynamicsController } from './controllers/thermodynamics.controller';
import { ThermodynamicsFluidController } from './controllers/thermodynamics-fluid.controller';
import { NumericController } from './controllers/numeric.controller';
import { GasPropertiesService } from './services/gas-properties.service';
import { TransportService } from './services/transport.service';
import { FluidPropertyService } from './services/fluid-property.service';
import { DimensionlessNumbersService } from './services/dimensionless-numbers.service';
import { DimensionlessCalculationService } from './services/dimensionless-calculation.service';
import { AerodynamicsService } from './services/aerodynamics.service';
import { DiffusionService } from './services/diffusion.service';
import { RadiationService } from './services/radiation.service';

@Module({
  controllers: [
    ThermodynamicsController,
    ThermodynamicsFluidController,
    NumericController,
  ],
  providers: [
    GasPropertiesService,
    TransportService,
    FluidPropertyService,
    DimensionlessNumbersService,
    DimensionlessCalculationService,
    AerodynamicsService,
    DiffusionService,
    RadiationService,
  ],
  exports: [
    GasPropertiesService,
    TransportService,
    FluidPropertyService,
    DimensionlessNumbersService,
    DimensionlessCalculationService,
    AerodynamicsService,
    DiffusionService,
    RadiationService,
  ],
})
export class ThermodynamicsModule {}

