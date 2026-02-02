import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RefractoryModule } from './modules/refractory/refractory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RefractoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

