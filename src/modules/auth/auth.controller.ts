import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register new user
  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  // Login user & get JWT
  @Post('login')
  login(@Body() loginDto: LoginAuthDto) {
    return this.authService.login(loginDto);
  }

  // Logout user
  @Post('logout')
  logout(@Body('userId') userId: number) {
    return this.authService.logout(userId);
  }

  // Refresh JWT token
  @Post('refresh-token')
  refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  // Request forgot-password link
  @Post('forgot-password')
  forgotPassword(@Body() forgotDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotDto);
  }

  // Reset password
  @Post('reset-password')
  resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetDto);
  }

}
