import { Module } from '@nestjs/common';
import { ThermodynamicsModule } from '../thermodynamics/thermodynamics.module';
import { RefractoryModule } from '../refractory/refractory.module';
import { MetalsModule } from '../metals/metals.module';
import { MultilayerWallService } from './services/multilayer-wall.service';
import { RecuperatorHtcService } from './services/recuperator-htc.service';
import { ThermalExchangeController } from './controllers/thermal-exchange.controller';

@Module({
  imports: [ThermodynamicsModule, RefractoryModule, MetalsModule],
  controllers: [ThermalExchangeController],
  providers: [MultilayerWallService, RecuperatorHtcService],
  exports: [MultilayerWallService, RecuperatorHtcService],
})
export class ThermalExchangeModule {}
