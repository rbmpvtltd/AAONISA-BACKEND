import { Body, Controller, Post, Req, Res, UseGuards,UseInterceptors,
  UploadedFile, } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, PreRegisterDto } from './dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage,Multer } from 'multer';
import { extname } from 'path';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Response } from 'express';
import { VerifyOtpDto } from '../otp/dto/verify-otp.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register-check')
  registerCheck(@Body() dto: PreRegisterDto) {
    return this.userService.preRegisterCheck(dto);
  }

  @Post('verify-otp-and-register')
  register(@Body() dto: RegisterDto,@Res() res:Response) {
    return this.userService.register(dto,res);
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

  @UseGuards(JwtAuthGuard)
  @Post('update-profile')
  @UseInterceptors(FileInterceptor('ProfilePicture', {
    storage: diskStorage({
      destination: './uploads/profiles',
      filename: (req, file, cb) => {
        const userId = req.user.sub || req.user.id || req.user.userId;
        const fileExtName = extname(file.originalname);
        const fileName = `${userId}${fileExtName}`;
        cb(null, fileName);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        cb(new Error('Only image files are allowed!'), false);
      } else {
        cb(null, true);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  }))
  async updateProfile(
    @Req() req,
    @Body() dto: UpdateUserProfileDto,
    @UploadedFile() file: Multer.File
  ) {
    const payload = req.user;
    return this.userService.updateProfile(dto, payload, file);
  }
  @UseGuards(JwtAuthGuard)
  @Post('update-user')
  updateUser(@Req() req, @Body() dto: UpdateUserDto) {
    const payload = req.user
    return this.userService.updateUser(dto,payload);
  }
}
