import { Module } from '@nestjs/common';
import { CmsModule } from '../cms/cms.module';
import { SsrShellController } from './controllers/ssr-shell.controller';
import { SsrShellService } from './services/ssr-shell.service';

@Module({
  imports: [CmsModule],
  controllers: [SsrShellController],
  providers: [SsrShellService],
})
export class SsrModule {}
