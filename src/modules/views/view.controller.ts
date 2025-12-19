// src/view/view.controller.ts

import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ViewService } from './view.service';
import { ViewDto } from './dto/view.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('View')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('view')
export class ViewController {
  constructor(private readonly viewService: ViewService) {}

  @Post('addview')
  async viewReel(@Body() dto: ViewDto, @Req() req: any) {
    const userId = req.user.userId;
    // console.log(userId, dto.storyId);
    return this.viewService.viewReel(userId, dto.storyId);
  }
}
