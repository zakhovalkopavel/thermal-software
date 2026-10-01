import { Module } from '@nestjs/common';
import { RefractoryController } from './controllers/refractory.controller';
import { MaterialCatalogController } from './controllers/material-catalog.controller';
import { PhaseEquilibriumService } from './services/composition/phase-equilibrium.service';
import { BlendOptimizerService } from './services/particle-packing/blend-optimizer.service';
import { PSDCalculatorService } from './services/particle-packing/psd-calculator.service';
import { PackingService } from './services/particle-packing/packing.service';
import { ShrinkageService } from './services/thermal/shrinkage.service';
import { WaterDemandService } from './services/particle-packing/water-demand.service';
import { GlassViscosityService } from './services/composition/glass-viscosity.service';
import { MineralPhaseService } from './services/composition/mineral-phase.service';
import { RefractorinessService } from './services/composition/refractoriness.service';
import { ThermalPerformanceService } from './services/thermal/thermal-performance.service';
import { ParticipationService } from './services/particle-packing/participation.service';
import { RefractoryThermalService } from './services/catalog/refractory-thermal.service';
import { MaterialCatalogService } from './services/catalog/material-catalog.service';
import { ParticleSizeCatalogService } from './services/catalog/particle-size-catalog.service';
import { MixComponentCatalogService } from './services/catalog/mix-component-catalog.service';
import { MixCompositionService } from './services/composition/mix-composition.service';

@Module({
  // MaterialCatalogController ends with GET /refractory/:groupRoute and must stay last.
  controllers: [RefractoryController, MaterialCatalogController],
  providers: [
    PhaseEquilibriumService,
    BlendOptimizerService,
    PSDCalculatorService,
    PackingService,
    ShrinkageService,
    WaterDemandService,
    GlassViscosityService,
    MineralPhaseService,
    RefractorinessService,
    ThermalPerformanceService,
    ParticipationService,
    RefractoryThermalService,
    MaterialCatalogService,
    ParticleSizeCatalogService,
    MixComponentCatalogService,
    MixCompositionService,
  ],
  exports: [
    PhaseEquilibriumService,
    BlendOptimizerService,
    PSDCalculatorService,
    PackingService,
    ShrinkageService,
    WaterDemandService,
    GlassViscosityService,
    MineralPhaseService,
    RefractorinessService,
    ThermalPerformanceService,
    ParticipationService,
    RefractoryThermalService,
    MaterialCatalogService,
    MixComponentCatalogService,
    MixCompositionService,
  ],
})
export class RefractoryModule {}
