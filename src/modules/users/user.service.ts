// src/users/user.service.ts
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/create-user.dto';
import { VerifyOtpDto } from '../otp/dto/verify-otp.dto';
import { AuthService } from '../auth/auth.service';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../otp/email.service';
import { SmsService } from '../otp/sms.service';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService
  ) { }

  async register(dto: RegisterDto, res: Response) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      phone_no: dto.phone_no,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    const userProfile = this.userProfileRepository.create({ user_id: savedUser.id, role: dto.role, paid: false, star: 1, profileName: 'aao_ni_saa_user' });
    const savedProfile = await this.userProfileRepository.save(userProfile);
    const tokens = this.authService.generateTokens({ sub: savedUser.id });

    savedUser.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userRepository.save(savedUser);

    res.cookie('accessToken', tokens.accessToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ message: 'User registered successfully' });
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.authService.generateTokens({ sub: user.id });
    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userRepository.save(user);

    res.cookie('accessToken', tokens.accessToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({ message: 'Login successful' });
  }

  async logout(userId: string, res: Response) {
    await this.userRepository.update(userId, { refreshToken: null });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  async refreshToken(userId: string, oldRefreshToken: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(oldRefreshToken, user.refreshToken))) {
      throw new BadRequestException('Invalid refresh token');
    }

    const tokens = this.authService.generateTokens({ sub: user.id });
    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userRepository.save(user);
    return tokens;
  }

  // async forgotPassword(dto: ForgotPasswordDto) {
  //   const user = await this.userRepository.findOne({ where: { email: dto.email } });
  //   if (!user) throw new NotFoundException('User not found');

  //   const resetToken = crypto.randomBytes(32).toString('hex');
  //   user.resetToken = await bcrypt.hash(resetToken, 10);
  //   user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
  //   await this.userRepository.save(user);
  //   return { message: 'Reset link sent to your email', token: resetToken };
  // }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User not found');
    const otp = await this.otpService.generateOtp(user.id);
    await this.emailService.sendOtp(user.email, otp);
    if (user.phone_no) {
      await this.smsService.sendOtpSms(user.phone_no, otp);
    }
    return 'OTP sent to your registered email/phone';
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User not found');
    const isValid = await this.otpService.validateOtp(user.id, dto.code);
    if (!isValid) throw new BadRequestException('Invalid OTP');
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = await bcrypt.hash(resetToken, 10);
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await this.userRepository.save(user);
    return { message: 'otp verified successfully', token: resetToken };
  }
  async resetPassword(dto: ResetPasswordDto) {
    const users = await this.userRepository.find();

    const user = users.find(u =>
      u.resetToken &&
      u.resetTokenExpiry &&
      bcrypt.compareSync(dto.token, u.resetToken)
    );

    if (
      !user ||
      !(user.resetTokenExpiry instanceof Date) ||
      user.resetTokenExpiry.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully' };
  }

}
