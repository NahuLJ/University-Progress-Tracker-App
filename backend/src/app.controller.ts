import { Controller, Get, Redirect } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  @Redirect('/api/docs', 302)
  root() {
    return;
  }
}
