import { Body, Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { AssignTokenDto } from './dto/assign-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
  @Post('create')
  create(@Body() dto: CreateTokenDto) {
    return this.tokenService.createToken(dto);
  }
  @UseGuards(JwtAuthGuard)
  @Post('assign')
  assign(@Body() dto: AssignTokenDto, @Req() req) {
    const userId = req.user.userId||req.user.id||req.user.sub;
    return this.tokenService.assignToken(dto, userId);
  }
  @UseGuards(JwtAuthGuard)
  @Delete('unassign/:token')
  unassign(@Param('token') token: string, @Req() req) {
    const userId = req.user.userId||req.user.id||req.user.sub;
    return this.tokenService.unassignToken(token, userId);
  }
  @UseGuards(JwtAuthGuard)
  @Delete('remove/:token')
  removeInvalid(@Param('token') token: string) {
    return this.tokenService.removeInvalidToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('send')
  sendNotification(@Req() req) {
    const userId = req.user.userId||req.user.id||req.user.sub;
    return this.tokenService.sendNotification(userId, 'test title', 'test body');
  }
}
