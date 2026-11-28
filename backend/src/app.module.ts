import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CmsModule } from './modules/cms/cms.module';
import { CompoundsModule } from './modules/compounds/compounds.module';
import { CombustionModule } from './modules/combustion/combustion.module';
import { MetalsModule } from './modules/metals/metals.module';
import { RecuperatorModule } from './modules/recuperator/recuperator.module';
import { RefractoryModule } from './modules/refractory/refractory.module';
import { SsrModule } from './modules/ssr/ssr.module';
import { ThermalDistributionModule } from './modules/thermal-distribution/thermal-distribution.module';
import { ThermalExchangeModule } from './modules/thermal-exchange/thermal-exchange.module';
import { ThermodynamicsModule } from './modules/thermodynamics/thermodynamics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    CmsModule,
    SsrModule,
    CompoundsModule,
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
