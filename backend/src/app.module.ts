import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RefractoryModule } from './modules/refractory/refractory.module';
import { ThermodynamicsModule } from './modules/thermodynamics/thermodynamics.module';
import { ThermalDistributionModule } from './modules/thermal-distribution/thermal-distribution.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThermodynamicsModule,
    RefractoryModule,
    ThermalDistributionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

