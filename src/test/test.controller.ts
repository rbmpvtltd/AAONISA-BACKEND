import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller('test')
export class TestController {
  @Get('/hello')
  hello(@Req() req: Request , @Res() res: Response) {
    return res.json({
      hello: "hello"
    });
  }
}
