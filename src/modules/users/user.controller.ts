import {
  Body, Controller, Post, Req, Res, UseGuards, UseInterceptors,
  UploadedFile,
  Get,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, PreRegisterDto } from './dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, Multer } from 'multer';
import { extname } from 'path';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'
import { UpdateEmailOtp, UpdatePhoneOtp, UpdateUserEmail, UpdateUserPhone } from './dto/update-user.dto'
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Response } from 'express';
import { VerifyOtpDto } from '../otp/dto/verify-otp.dto';
import { BlockUserDto } from './dto/block.dto';
import { BlockService } from './block.service';

import * as path from 'path';
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService, private readonly blockService: BlockService) { }

  @Post('register-check')
  registerCheck(@Body() dto: PreRegisterDto) {
    return this.userService.preRegisterCheck(dto);
  }

  @Post('verify-otp-and-register')
  register(@Body() dto: RegisterDto, @Res() res: Response) {
    return this.userService.register(dto, res);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Res() res: Response) {
    return this.userService.login(dto, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req, @Res() res: Response) {
    return this.userService.logout(req.user.sub, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  refreshToken(@Req() req, @Body('oldRefreshToken') oldToken: string) {
    return this.userService.refreshToken(req.user.sub, oldToken);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.userService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.userService.verifyOtp(dto);
  }

  // @UseGuards(JwtAuthGuard)
  // @Post('update-profile-send-otp')
  // updateProfileOtp(@Req() req) {
  //   const payload = req.user;
  //   const userId = payload?.sub || payload?.id || payload?.userId;
  //   return this.userService.updateProfileOtp(userId.toString());
  // }

  @UseGuards(JwtAuthGuard)
  @Post('update-email-send-otp')
  updateEmailOtp(@Req() req, @Body() dto: UpdateEmailOtp) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.userService.updateEmailOtp(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-phone-send-otp')
  updatePhoneOtp(@Req() req, @Body() dto: UpdatePhoneOtp) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.userService.updatePhoneOtp(dto);
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req, @Body() dto: any) {
    return this.userService.updateProfile(dto, req.user);
  }


  @UseGuards(JwtAuthGuard)
  @Get('profile/current')
  async getCurrentUser(@Req() req) {
    // const userId = req.user?.id;
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.userService.getCurrentUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/:username')
  async getProfileByUsername(@Param('username') username: string) {
    return this.userService.getProfileByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(@Query('q') query: string) {
    const users = await this.userService.searchUsers(query);
    return users;
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-user-email')
  updateUserEmail(@Req() req, @Body() dto: UpdateUserEmail) {
    const payload = req.user
    return this.userService.updateUserEmail(dto, payload);
  }



  @UseGuards(JwtAuthGuard)
  @Post('update-user-phone')
  updateUserPhone(@Req() req, @Body() dto: UpdateUserPhone) {
    const payload = req.user
    return this.userService.updateUserPhone(dto, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Post('block-user')
  async blockUser(@Body() dto: BlockUserDto, @Req() req: any) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.blockService.blockUser(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unblock-user')
  async unblockUser(@Body() dto: BlockUserDto, @Req() req: any) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.blockService.unblockUser(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-blocked-users')
  async getBlockedUsers(@Req() req: any) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.blockService.getBlockedUsers(userId);
  }
}
