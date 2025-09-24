// src/users/user.service.ts
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Multer } from 'multer'
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'
import { UpdateUserEmail, UpdateUserPhone } from './dto/update-user.dto'
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

  async preRegisterCheck(dto: { emailOrPhone: string; username: string }) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.emailOrPhone);

    const existingUser = await this.userRepository.findOne({
      where: [
        isEmail ? { email: dto.emailOrPhone } : { phone_no: dto.emailOrPhone },
        { username: dto.username },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('Email, phone number or username already in use');
    }

    const otp = await this.otpService.generateOtp({
      email: isEmail ? dto.emailOrPhone : undefined,
      phone_no: !isEmail ? dto.emailOrPhone : undefined,
    });

    if (isEmail) {
      await this.emailService.sendOtp(dto.emailOrPhone, otp);
    } else {
      await this.smsService.sendOtpSms(dto.emailOrPhone, otp);
    }

    return { message: 'OTP sent for verification', success: true };
  }


  async register(dto: RegisterDto, res: Response) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.emailOrPhone);
    const isValidOtp = await this.otpService.validateOtp({
      email: isEmail ? dto.emailOrPhone : undefined,
      phone_no: !isEmail ? dto.emailOrPhone : undefined,
      code: dto.otp,
    });

    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    const existingUser = await this.userRepository.findOne({
      where: [
        isEmail ? { email: dto.emailOrPhone } : { phone_no: dto.emailOrPhone },
        { username: dto.username },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('Email, phone number or username already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      username: dto.username,
      email: isEmail ? dto.emailOrPhone : undefined,
      phone_no: !isEmail ? dto.emailOrPhone : undefined,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const userProfile = this.userProfileRepository.create({
      user_id: savedUser.id,
      name: savedUser.username,
      role: dto.role,
      paid: false,
      star: 1,
    });

    await this.userProfileRepository.save(userProfile);

    const tokens = this.authService.generateTokens({ sub: savedUser.id });
    savedUser.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userRepository.save(savedUser);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({ message: 'User registered successfully', success: true });
  }


  async login(dto: LoginDto, res: Response) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.identifier);

    const user = await this.userRepository.findOne({
      where: isEmail ? { email: dto.identifier } : { phone_no: dto.identifier },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.authService.generateTokens({ sub: user.id });
    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userRepository.save(user);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: 'Login successful', accessToken: tokens.accessToken, success: true });
  }


  async logout(userId: string, res: Response) {
    await this.userRepository.update(userId, { refreshToken: null });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully', success: true };
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.emailOrPhone);

    const user = await this.userRepository.findOne({
      where: isEmail ? { email: dto.emailOrPhone } : { phone_no: dto.emailOrPhone },
    });

    if (!user) throw new NotFoundException('User not found');

    const otp = await this.otpService.generateOtp({
      email: user.email,
      phone_no: user.phone_no,
    });

    if (user.email) await this.emailService.sendOtp(user.email, otp);
    if (user.phone_no) await this.smsService.sendOtpSms(user.phone_no, otp);

    return { message: 'OTP sent for verification', success: true };
  }


  async verifyOtp(dto: { emailOrPhone?: string; code: string }) {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    let email: string | undefined;
    let phone_no: string | undefined;
    if (dto.emailOrPhone && emailRegex.test(dto.emailOrPhone)) {
      email = dto.emailOrPhone;
    } else if (dto.emailOrPhone && phoneRegex.test(dto.emailOrPhone)) {
      phone_no = dto.emailOrPhone;
    } else {
      throw new BadRequestException('Invalid email or phone number format');
    }
    console.log(email, phone_no);
    const user = await this.userRepository.findOne({ where: { email: email, phone_no: phone_no } }); if (!user) throw new NotFoundException('User not found');

    const isValid = await this.otpService.validateOtp({
      email,
      phone_no,
      code: dto.code,
    });
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    const resetToken = crypto.randomBytes(32).toString('hex'); user.resetToken = await bcrypt.hash(resetToken, 10); user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await this.userRepository.save(user);
    return { message: 'OTP verified successfully', token: resetToken, success: true };
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

    return { message: 'Password reset successfully', success: true };
  }

  // async updateProfileOtp(userId: string) {
  //   const user = await this.userRepository.findOne({ where: { id: userId } });

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   const phone_no = user.phone_no;
  //   const email = user.email;
  //   const otp = await this.otpService.generateOtp({
  //     userId
  //   })

  //   if (email) await this.emailService.sendOtp(email, otp);
  //   if (phone_no) await this.smsService.sendOtpSms(phone_no, otp);
  //   return { message: 'OTP sent for verification', success: true };
  // }

  async updateProfile(dto: UpdateUserProfileDto, payload: any, file?: Multer.File) {
    const userId = payload?.sub || payload?.id || payload?.userId;

    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const userProfile = await this.userProfileRepository.findOne({ where: { user_id: userId } });
    if (!user || !userProfile) {
      throw new NotFoundException('User not found');
    }

    if (dto.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: dto.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Username already taken');
      }
    }

    if (file) {
      userProfile.ProfilePicture = `../../uploads/profiles/${file.filename}`;
    }

    userProfile.name = dto.name || userProfile.name;
    userProfile.bio = dto.bio || userProfile.bio;
    userProfile.url = dto.url || userProfile.url;
    await this.userProfileRepository.save(userProfile);
    if (dto.username) {
      user.username = dto.username;
      await this.userRepository.save(user);
    }
    return {
      message: 'Profile updated successfully',
      success: true,
    };
  }

  async updateEmailOtp(dto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });

    if (user) {
      throw new NotFoundException('Email is Taken');
    }
    const email = dto.email;
    const otp = await this.otpService.generateOtp({
      email
    })

    if (email) await this.emailService.sendOtp(email, otp);
    return { message: 'OTP sent for verification', success: true };
  }

  async updatePhoneOtp(dto) {
    const user = await this.userRepository.findOne({ where: { phone_no: dto.phone } });

    if (user) {
      throw new NotFoundException('Phone No Is Taken');
    }
    const phone = dto.phone;
    const otp = await this.otpService.generateOtp({
      phone_no: phone
    })

    if (phone) await this.smsService.sendOtpSms(phone, otp);
    return { message: 'OTP sent for verification', success: true };
  }

  async updateUserEmail(dto: UpdateUserEmail, payload) {
    const userId = payload?.sub || payload?.id || payload.userId;
    if (!userId) throw new UnauthorizedException('Invalid token');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const { email } = dto;
    if (!email) {
      throw new BadRequestException('No Email provided to update');
    }

    const errors: Record<string, string> = {};
    if (email) {
      const existingEmail = await this.userRepository.findOne({ where: { email } });
      if (existingEmail && existingEmail.id !== user.id) {
        errors.email = 'Email already in use';
      }
    }

    const isValid = await this.otpService.validateOtp({
      email: email,
      code: dto.otp,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (email) user.email = email;

    await this.userRepository.save(user);

    return {
      message: 'Email updated successfully',
      success: true,
    };
  }

  async updateUserPhone(dto: UpdateUserPhone, payload) {
    const userId = payload?.sub || payload?.id || payload.userId;
    if (!userId) throw new UnauthorizedException('Invalid token');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const { phone } = dto;
    if (!phone) {
      throw new BadRequestException('No Phone Number provided to update');
    }

    const errors: Record<string, string> = {};
    if (phone) {
      const existingPhone = await this.userRepository.findOne({ where: { phone_no: phone } });
      if (existingPhone && existingPhone.id !== user.id) {
        errors.Phone = 'phone already in use';
      }
    }

    const isValid = await this.otpService.validateOtp({
      phone_no: phone,
      code: dto.otp,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (phone) user.phone_no = phone;

    await this.userRepository.save(user);

    return {
      message: 'Phone updated successfully',
      success: true,
    };
  }

  async getFollowState(){

  }
} 
