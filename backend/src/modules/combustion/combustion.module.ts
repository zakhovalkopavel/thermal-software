import { Module } from '@nestjs/common';
import { ThermodynamicsModule } from '../thermodynamics/thermodynamics.module';
import { CombustionService } from './services/combustion.service';
import { CombustionController } from './controllers/combustion.controller';

@Module({
  imports: [ThermodynamicsModule],
  controllers: [CombustionController],
  providers: [CombustionService],
  exports: [CombustionService],
})
export class CombustionModule {}
