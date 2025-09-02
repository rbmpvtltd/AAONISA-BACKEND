// src/auth/auth.controller.ts
import { Body, Controller, Post, Req, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/create-auth.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/role.guard';
import { Roles } from 'src/common/utils/decorators';
import { Response } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    console.log('hi');
    await this.authService.register(dto, res);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Res() res: Response) {
    return this.authService.login(dto, res);
  }

  @UseGuards(JwtAuthGuard)
@Post('logout')
async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
  await this.authService.logout(req.user.userId);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return { message: 'Logged out successfully' };
}

  @UseGuards(JwtAuthGuard)
@Post('refresh-token')
async refresh(@Body('oldRefreshToken') oldRefreshToken: string, @Req() req) {
  return this.authService.refreshToken(req.user.id, oldRefreshToken);
}

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    
 this.authService.resetPassword(dto);
  }
}
