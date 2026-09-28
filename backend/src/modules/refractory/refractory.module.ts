import { Module } from '@nestjs/common';
import { RefractoryController } from './controllers/refractory.controller';
import { MaterialCatalogController } from './controllers/material-catalog.controller';
import { PhaseEquilibriumService } from './services/phase-equilibrium.service';
import { BlendOptimizerService } from './services/blend-optimizer.service';
import { PSDCalculatorService } from './services/psd-calculator.service';
import { PackingService } from './services/packing.service';
import { ShrinkageService } from './services/shrinkage.service';
import { WaterDemandService } from './services/water-demand.service';
import { GlassViscosityService } from './services/glass-viscosity.service';
import { MineralPhaseService } from './services/mineral-phase.service';
import { RefractorinessService } from './services/refractoriness.service';
import { ThermalPerformanceService } from './services/thermal-performance.service';
import { ParticipationService } from './services/participation.service';
import { RefractoryThermalService } from './services/refractory-thermal.service';
import { MaterialCatalogService } from './services/material-catalog.service';
import { ParticleSizeCatalogService } from './services/particle-size-catalog.service';
import { MixComponentCatalogService } from './services/mix-component-catalog.service';
import { MixCompositionService } from './services/mix-composition.service';

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
