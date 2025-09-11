// src/auth/auth.controller.ts
import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { UserService } from '../users/user.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../users/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Res() res: Response) {
    return this.userService.register(dto, res);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Res() res: Response) {
    return this.userService.login(dto, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: any, @Res() res: Response) {
    return this.userService.logout(req.user.sub, res);
  }

  @Post('refresh-token')
  refreshToken(@Body('oldRefreshToken') oldToken: string, @Req() req: any) {
    return this.userService.refreshToken(req.user.sub, oldToken);
  }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.userService.forgotPassword(dto);
  }

  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(dto);
  }
}
