import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RefractoryModule } from './modules/refractory/refractory.module';
import { ThermodynamicsModule } from './modules/thermodynamics/thermodynamics.module';
import { ThermalDistributionModule } from './modules/thermal-distribution/thermal-distribution.module';
import { CombustionModule } from './modules/combustion/combustion.module';
import { MetalsModule } from './modules/metals/metals.module';
import { ThermalExchangeModule } from './modules/thermal-exchange/thermal-exchange.module';
import { RecuperatorModule } from './modules/recuperator/recuperator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThermodynamicsModule,
    RefractoryModule,
    ThermalDistributionModule,
    CombustionModule,
    MetalsModule,
    ThermalExchangeModule,
    RecuperatorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

