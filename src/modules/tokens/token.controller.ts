import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { AssignTokenDto } from './dto/assign-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  // ✅ Create token (no user yet)
  @Post('create')
  async create(@Body() dto: CreateTokenDto) {
    return this.tokenService.createToken(dto);
  }

  // ✅ Assign token (requires JWT)
  @UseGuards(JwtAuthGuard)
  @Post('assign')
  async assign(@Req() req, @Body() dto: AssignTokenDto) {
    const userId = req.user?.id; // extracted from JWT
    return this.tokenService.assignToken(dto, userId);
  }

  // ✅ Unassign token (logout)
  @UseGuards(JwtAuthGuard)
  @Post('unassign')
  async unassign(@Req() req, @Body('token') token: string) {
    const userId = req.user?.id;
    return this.tokenService.unassignToken(token, userId);
  }

  // ✅ Get all user tokens
  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getUserTokens(@Req() req) {
    const userId = req.user?.id;
    return this.tokenService.getUserTokens(userId);
  }

  // ✅ Debug: get info by token
  @Get(':token')
  async getTokenInfo(@Param('token') token: string) {
    return this.tokenService.getTokenInfo(token);
  }
}
