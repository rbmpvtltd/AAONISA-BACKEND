import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
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
  assign(@Body() dto: AssignTokenDto) {
    return this.tokenService.assignToken(dto);
  }
  @UseGuards(JwtAuthGuard)
  @Delete('unassign/:token')
  unassign(@Param('token') token: string) {
    return this.tokenService.unassignToken(token);
  }
  @UseGuards(JwtAuthGuard)
  @Delete('remove/:token')
  removeInvalid(@Param('token') token: string) {
    return this.tokenService.removeInvalidToken(token);
  }
}
