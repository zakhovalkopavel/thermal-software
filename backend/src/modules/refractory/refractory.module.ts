import { Module } from '@nestjs/common';
import { RefractoryController } from './controllers/refractory.controller';
import { PhaseEquilibriumService } from './services/phase-equilibrium.service';
import { BlendOptimizerService } from './services/blend-optimizer.service';
import { PSDCalculatorService } from './services/psd-calculator.service';
import { PackingService } from './services/packing.service';
import { ShrinkageService } from './services/shrinkage.service';
import { GlassViscosityService } from './services/glass-viscosity.service';
import { MineralPhaseService } from './services/mineral-phase.service';
import { ViscosityService } from './services/viscosity.service';
import { RefractorinessService } from './services/refractoriness.service';
import { ThermalPerformanceService } from './services/thermal-performance.service';
import { ParticipationService } from './services/participation.service';

@Module({
  controllers: [RefractoryController],
  providers: [
    PhaseEquilibriumService,
    BlendOptimizerService,
    PSDCalculatorService,
    PackingService,
    ShrinkageService,
    GlassViscosityService,
    MineralPhaseService,
    ViscosityService,
    RefractorinessService,
    ThermalPerformanceService,
    ParticipationService,
  ],
  exports: [
    PhaseEquilibriumService,
    BlendOptimizerService,
    PSDCalculatorService,
    PackingService,
    ShrinkageService,
    GlassViscosityService,
    MineralPhaseService,
    ViscosityService,
    RefractorinessService,
    ThermalPerformanceService,
    ParticipationService,
  ],
})
export class RefractoryModule {}



