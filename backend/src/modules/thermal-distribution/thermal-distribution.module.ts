import { Module } from '@nestjs/common';
import { ThermalDistributionController } from './controllers/thermal-distribution.controller';
import { ThermalDistributionService }    from './services/thermal-distribution.service';

@Module({
  controllers: [ThermalDistributionController],
  providers:   [ThermalDistributionService],
  exports:     [ThermalDistributionService],
})
export class ThermalDistributionModule {}
