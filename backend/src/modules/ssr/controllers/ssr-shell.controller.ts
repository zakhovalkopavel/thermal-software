import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SsrShellService } from '../services/ssr-shell.service';

@Controller('ssr')
export class SsrShellController {
  constructor(private readonly ssrShellService: SsrShellService) {}

  @Get()
  async renderRoot(@Res() res: Response): Promise<void> {
    const html = await this.ssrShellService.renderForPath('/');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('*path')
  async renderPath(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const prefix = '/ssr';
    const raw =
      req.path === prefix || req.path === `${prefix}/`
        ? '/'
        : req.path.slice(prefix.length);
    const html = await this.ssrShellService.renderForPath(raw || '/');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
