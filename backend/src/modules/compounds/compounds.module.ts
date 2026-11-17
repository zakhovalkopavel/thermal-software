import { Module } from '@nestjs/common';
import { CompoundsController } from './controllers/compounds.controller';
import { CompoundBoundsService } from './services/compound-bounds.service';
import { CompoundSearchService } from './services/compound-search.service';

@Module({
  controllers: [CompoundsController],
  providers: [CompoundSearchService, CompoundBoundsService],
  exports: [CompoundSearchService, CompoundBoundsService],
})
export class CompoundsModule {}
