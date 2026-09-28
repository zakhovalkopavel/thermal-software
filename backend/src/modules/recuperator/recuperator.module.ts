import { Module } from '@nestjs/common';
import { ThermodynamicsModule } from '../thermodynamics/thermodynamics.module';
import { CombustionModule } from '../combustion/combustion.module';
import { ThermalExchangeModule } from '../thermal-exchange/thermal-exchange.module';
import { RecuperatorGeometryService } from './services/recuperator-geometry.service';
import { RecuperatorService } from './services/recuperator.service';
import { RecuperatorController } from './controllers/recuperator.controller';

@Module({
  imports: [ThermodynamicsModule, CombustionModule, ThermalExchangeModule],
  controllers: [RecuperatorController],
  providers: [RecuperatorGeometryService, RecuperatorService],
  exports: [RecuperatorService, RecuperatorGeometryService],
})
export class RecuperatorModule {}
