import { Module } from '@nestjs/common';
import { MetalThermalService } from './services/metal-thermal.service';
import { MetalsController } from './controllers/metals.controller';

@Module({
  controllers: [MetalsController],
  providers: [MetalThermalService],
  exports: [MetalThermalService],
})
export class MetalsModule {}
