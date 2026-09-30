import { Module } from '@nestjs/common';
import { ThermodynamicsModule } from '../thermodynamics/thermodynamics.module';
import { ThermalExchangeModule } from '../thermal-exchange/thermal-exchange.module';
import { CombustionService } from './services/combustion.service';
import { CombustionEnthalpyService } from './services/combustion-enthalpy.service';
import { ProductEquilibriumService } from './services/product-equilibrium.service';
import { FlameSolverService } from './services/flame-solver.service';
import { SolidCombustionService } from './services/solid-combustion.service';
import { FluidCombustionService } from './services/fluid-combustion.service';
import { ChemicalKineticsService } from './services/chemical-kinetics.service';
import { BedCombustionService } from './services/bed-combustion.service';
import { CombustionController } from './controllers/combustion.controller';

@Module({
  imports: [ThermodynamicsModule, ThermalExchangeModule],
  controllers: [CombustionController],
  providers: [
    CombustionService,
    CombustionEnthalpyService,
    ProductEquilibriumService,
    FlameSolverService,
    SolidCombustionService,
    FluidCombustionService,
    ChemicalKineticsService,
    BedCombustionService,
  ],
  exports: [CombustionService, CombustionEnthalpyService, FlameSolverService],
})
export class CombustionModule {}
