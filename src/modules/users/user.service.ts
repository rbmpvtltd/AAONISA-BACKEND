// src/users/user.service.ts
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Multer } from 'multer'
import { Like, Repository } from 'typeorm';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as sharp from 'sharp';

import { UserProfile } from './entities/user-profile.entity';
import { User, UserRole } from './entities/user.entity';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'
import { UpdateUserEmail, UpdateUserPhone } from './dto/update-user.dto'
import { VerifyOtpDto } from '../otp/dto/verify-otp.dto';
import { UploadService } from '../upload/upload.service';
import { AuthService } from '../auth/auth.service';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../otp/email.service';
import { SmsService } from '../otp/sms.service';
import { TokenService } from '../tokens/token.service';
import { extname } from 'path';
import { Follow } from '../follows/entities/follow.entity';
import { Video } from '../stream/entities/video.entity';
const fs = require('fs');
const path = require('path');
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Follow) // ✅ Add this line
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(Video) private videoRepository: Repository<Video>,
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly uploadService: UploadService,
    private readonly tokenService: TokenService
  ) { }

  private async checkUserAvailability(
    emailOrPhone: string,
    username: string,
  ) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone);

    // Check email or phone separately
    if (isEmail) {
      const existingEmail = await this.userRepository.findOne({ where: { email: emailOrPhone } });
      if (existingEmail) {
        return {
          success: false,
          field: 'email',
          message: 'Email already in use',
        };
      }
    } else {
      const existingPhone = await this.userRepository.findOne({ where: { phone_no: emailOrPhone } });
      if (existingPhone) {
        return {
          success: false,
          field: 'phone',
          message: 'Phone number already in use',
        };
      }
    }

    // Check username separately
    const existingUsername = await this.userRepository.findOne({ where: { username } });
    if (existingUsername) {
      return {
        success: false,
        field: 'username',
        message: 'Username already in use',
      };
    }

    return { success: true, isEmail };
  }

  // async preRegisterCheck(dto: { emailOrPhone: string; username: string }) {
  //   const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.emailOrPhone);

  //   const existingUser = await this.userRepository.findOne({
  //     where: [
  //       isEmail ? { email: dto.emailOrPhone } : { phone_no: dto.emailOrPhone },
  //       { username: dto.username },
  //     ],
  //   });

  //   if (existingUser) {
  //     throw new BadRequestException('Email, phone number or username already in use');
  //   }

  //   const otp = await this.otpService.generateOtp({
  //     email: isEmail ? dto.emailOrPhone : undefined,
  //     phone_no: !isEmail ? dto.emailOrPhone : undefined,
  //   });

  //   if (isEmail) {
  //     await this.emailService.sendOtp(dto.emailOrPhone, otp);
  //   } else {
  //     await this.smsService.sendOtpSms(dto.emailOrPhone, otp);
  //   }

  //   return { message: 'OTP sent for verification', success: true };
  // }
  async preRegisterCheck(dto: { emailOrPhone: string; username: string }) {
    const check = await this.checkUserAvailability(dto.emailOrPhone, dto.username);
    console.log('check', check)
    if (!check.success) {
      return {
        statusCode: 400,
        message: check.message,
        success: false,
        field: check.field,
      };
    }

    const otp = await this.otpService.generateOtp({
      email: check.isEmail ? dto.emailOrPhone : undefined,
      phone_no: !check.isEmail ? dto.emailOrPhone : undefined,
    });

    if (check.isEmail) {
      await this.emailService.sendOtp(dto.emailOrPhone, otp);
    } else {
      await this.smsService.sendOtpSms(dto.emailOrPhone, otp);
    }

    return { message: 'OTP sent for verification', success: true };
  }


  //   async register(dto: RegisterDto, res: Response) {
  //   try {
  //     const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.emailOrPhone);

  //     const isValidOtp = await this.otpService.validateOtp({
  //       email: isEmail ? dto.emailOrPhone : undefined,
  //       phone_no: !isEmail ? dto.emailOrPhone : undefined,
  //       code: dto.otp,
  //     });

  //     if (!isValidOtp) {
  //       return res.status(400).json({ 
  //         statusCode: 400, 
  //         message: 'Invalid or expired OTP', 
  //         success: false 
  //       });
  //     }

  //     // Email / Phone check
  //     if (isEmail) {
  //       const existingEmail = await this.userRepository.findOne({ where: { email: dto.emailOrPhone } });
  //       if (existingEmail) {
  //         return res.status(400).json({
  //           statusCode: 400,
  //           message: 'Email already in use',
  //           success: false,
  //         });
  //       }
  //     } else {
  //       const existingPhone = await this.userRepository.findOne({ where: { phone_no: dto.emailOrPhone } });
  //       if (existingPhone) {
  //         return res.status(400).json({
  //           statusCode: 400,
  //           message: 'Phone number already in use',
  //           success: false,
  //         });
  //       }
  //     }

  //     // Username check
  //     const existingUsername = await this.userRepository.findOne({ where: { username: dto.username } });
  //     if (existingUsername) {
  //       return res.status(400).json({
  //         statusCode: 400,
  //         message: 'Username already in use',
  //         success: false,
  //       });
  //     }

  //     // Hash password
  //     const hashedPassword = await bcrypt.hash(dto.password, 10);

  //     // Create user
  //     const user = this.userRepository.create({
  //       username: dto.username,
  //       email: isEmail ? dto.emailOrPhone : undefined,
  //       phone_no: !isEmail ? dto.emailOrPhone : undefined,
  //       password: hashedPassword,
  //     });
  //     const savedUser = await this.userRepository.save(user);

  //     // Create profile
  //     const userProfile = this.userProfileRepository.create({
  //       user_id: savedUser.id,
  //       name: savedUser.username,
  //       role: dto.role,
  //       paid: false,
  //       star: 1,
  //     });
  //     await this.userProfileRepository.save(userProfile);

  //     // Generate tokens
  //     const tokens = this.authService.generateTokens({ sub: savedUser.id });
  //     savedUser.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
  //     await this.userRepository.save(savedUser);

  //     // Set cookies
  //     res.cookie('accessToken', tokens.accessToken, {
  //       httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000,
  //     });
  //     res.cookie('refreshToken', tokens.refreshToken, {
  //       httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
  //     });

  //     return res.status(201).json({ message: 'User registered successfully', success: true });

  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).json({
  //       statusCode: 500,
  //       message: 'Internal server error',
  //       success: false,
  //     });
  //   }
  // }

  async register(dto: RegisterDto, res: Response) {
    try {
      const check = await this.checkUserAvailability(
        dto.emailOrPhone,
        dto.username,
      );

      if (!check.success) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Email or phone number already in use',
          success: false,
        });
      }

      const isValidOtp = await this.otpService.validateOtp({
        email: check.isEmail ? dto.emailOrPhone : undefined,
        phone_no: !check.isEmail ? dto.emailOrPhone : undefined,
        code: dto.otp,
      });

      if (!isValidOtp) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Invalid or expired OTP',
          success: false,
        });
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = this.userRepository.create({
        username: dto.username,
        email: check.isEmail ? dto.emailOrPhone : undefined,
        phone_no: !check.isEmail ? dto.emailOrPhone : undefined,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);

      // Create profile
      const userProfile = this.userProfileRepository.create({
        user_id: savedUser.id,
        name: savedUser.username,
        role: dto.role,
        paid: false,
        star: 1,
      });
      await this.userProfileRepository.save(userProfile);

      const officialAccount = await this.userRepository.findOneBy({
        username: "hithoy-official",
      });

      if (officialAccount) {
        const follow = this.followRepository.create({
          follower: savedUser,
          following: officialAccount,
        });

        await this.followRepository.save(follow);
      }

      // Generate tokens
      const tokens = this.authService.generateTokens({ sub: savedUser.id });
      savedUser.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
      await this.userRepository.save(savedUser);

      // Set cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000,
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({ message: 'User registered successfully', success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        statusCode: 500,
        message: err.message || 'Internal server error',
        success: false,
      });
    }
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

  // async updateProfile(dto: any, payload: any) {
  //   const userId = payload?.sub || payload?.id || payload?.userId;
  //   if (!userId) throw new UnauthorizedException('Invalid token');

  //   const user = await this.userRepository.findOne({ where: { id: userId } });
  //   const userProfile = await this.userProfileRepository.findOne({ where: { user_id: userId } });

  //   if (!user || !userProfile) throw new NotFoundException('User not found');

  //   const imageChanged = dto.imageChanged === 'true' || dto.imageChanged === true;

  //   // ✅ Upload new image
  //   if (imageChanged && dto.ProfilePicture) {
  //     const base64Str = dto.ProfilePicture.split(';base64,')[1];
  //     if (!base64Str) throw new BadRequestException("Invalid base64 image");

  //     const buffer = Buffer.from(base64Str, 'base64');
  //     const fileName = `${userId}.jpg`;

  //     if (userProfile.ProfilePicture) {
  //       const oldKey = userProfile.ProfilePicture.split('.com/')[1];
  //       if (oldKey) await this.uploadService.deleteFile(oldKey);
  //     }

  //     const uploaded = await this.uploadService.uploadFile(buffer, "profiles", fileName);
  //     userProfile.ProfilePicture = uploaded.publicUrl || uploaded.url;
  //   }

  //   // ✅ Remove image
  //   if (imageChanged && !dto.ProfilePicture) {
  //     if (userProfile.ProfilePicture) {
  //       const oldKey = userProfile.ProfilePicture.split('.com/')[1];
  //       if (oldKey) await this.uploadService.deleteFile(oldKey);
  //     }
  //     userProfile.ProfilePicture = '';
  //   }
  //     // ✅ Update profile fields
  //     userProfile.name = dto.name ?? userProfile.name;
  //     userProfile.bio = dto.bio ?? userProfile.bio;
  //     userProfile.url = dto.url ?? userProfile.url;

  //     await this.userProfileRepository.save(userProfile);

  //     // ✅ Update username
  //     if (dto.username) {
  //       const existingUser = await this.userRepository.findOne({ where: { username: dto.username } });
  //       if (existingUser && existingUser.id !== user.id)
  //         throw new BadRequestException('Username already taken');

  //     }

  //     // ✅ ✅ MOST IMPORTANT: re-fetch updated data
  //     const updatedUser = await this.userRepository.findOne({
  //       where: { id: userId },
  //       relations: ["userProfile"]
  //     });
  //     if (!updatedUser) throw new NotFoundException('User not found');

  //     return {
  //       success: true,
  //       message: "Profile updated successfully",
  //       data: {
  //         username: updatedUser.username,
  //         name: updatedUser.userProfile.name,
  //         bio: updatedUser.userProfile.bio,
  //         url: updatedUser.userProfile.url,
  //         profilePicture: updatedUser.userProfile.ProfilePicture,
  //       }

  //     };
  // }

  // async updateProfile(dto: UpdateUserProfileDto, payload: any) {
  //   const userId = payload?.sub || payload?.id || payload?.userId;
  //   if (!userId) throw new UnauthorizedException("Invalid token");

  //   const user = await this.userRepository.findOne({ where: { id: userId } });
  //   const userProfile = await this.userProfileRepository.findOne({ where: { user_id: userId } });

  //   if (!user || !userProfile) throw new NotFoundException("User not found");

  //   const imageChanged = dto.imageChanged === 'true'

  //   // ✅ New image upload
  //   if (imageChanged && dto.ProfilePicture) {
  //     const base64Str = dto.ProfilePicture.split(";base64,")[1];
  //     if (!base64Str) throw new BadRequestException("Invalid base64 image");

  //     const buffer = Buffer.from(base64Str, "base64");
  //     const fileName = `${userId}.jpg`;

  //     if (userProfile.ProfilePicture) {
  //       const oldKey = userProfile.ProfilePicture.split(".com/")[1];
  //       if (oldKey) await this.uploadService.deleteFile(oldKey);
  //     }

  //     // const uploaded = await this.uploadService.uploadFile(buffer, "profiles", fileName);
  //     //   const uploaded = await this.uploadService.uploadFile(
  //     //     buffer,
  //     //     "profiles",
  //     //     fileName,
  //     //     "public, max-age=0, must-revalidate"
  //     //   );

  //     //   userProfile.ProfilePicture = uploaded.publicUrl || uploaded.url;
  //     // }

  //     const uploaded = await this.uploadService.uploadFile(
  //       buffer,
  //       "profiles",
  //       fileName,
  //       "no-cache, no-store, must-revalidate"
  //     );

  //     //  ✅   Add timestamp to URL to bust cache - THIS IS CRITICAL!
  //     const timestamp = Date.now();
  //     const imageUrl = uploaded.publicUrl || uploaded.url;
  //     userProfile.ProfilePicture = `${imageUrl}?v=${timestamp}`;
  //   }

  //   // ✅ Remove image
  //   if (imageChanged && !dto.ProfilePicture) {
  //     if (userProfile.ProfilePicture) {
  //       const oldKey = userProfile.ProfilePicture.split(".com/")[1];
  //       if (oldKey) await this.uploadService.deleteFile(oldKey);
  //     }
  //     userProfile.ProfilePicture = '';
  //   }

  //   // ✅ Update fields
  //   userProfile.name = dto.name ?? userProfile.name;
  //   userProfile.bio = dto.bio ?? userProfile.bio;
  //   userProfile.url = dto.url ?? userProfile.url;

  //   await this.userProfileRepository.save(userProfile);

  //   // ✅ Update username
  //   if (dto.username) {
  //     const exists = await this.userRepository.findOne({ where: { username: dto.username } });
  //     if (exists && exists.id !== user.id) throw new BadRequestException("Username already taken");

  //     user.username = dto.username;
  //     await this.userRepository.save(user);
  //   }

  //   // ✅ Fetch updated data
  //   const updatedUser = await this.userRepository.findOne({
  //     where: { id: userId },
  //     relations: ["userProfile"],
  //   });
  //   if (!updatedUser) throw new NotFoundException('User not found');
  //   return {
  //     success: true,
  //     message: "Profile updated successfully",
  //     data: {
  //       username: updatedUser.username,
  //       name: updatedUser.userProfile.name,
  //       bio: updatedUser.userProfile.bio,
  //       url: updatedUser.userProfile.url,
  //       ProfilePicture: updatedUser.userProfile.ProfilePicture,
  //     },
  //   };
  // }


  async updateProfile(dto: UpdateUserProfileDto, payload: any) {
    const userId = payload?.sub || payload?.id || payload?.userId;
    if (!userId) throw new UnauthorizedException("Invalid token");

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const userProfile = await this.userProfileRepository.findOne({ where: { user_id: userId } });

    if (!user || !userProfile) throw new NotFoundException("User not found");

    const imageChanged = dto.imageChanged === 'true'

    // ✅ New image upload with compression
    if (imageChanged && dto.ProfilePicture) {
      const base64Str = dto.ProfilePicture.split(";base64,")[1];
      if (!base64Str) throw new BadRequestException("Invalid base64 image");

      const buffer = Buffer.from(base64Str, "base64");

      // ✅ COMPRESS IMAGE USING SHARP
      const compressedBuffer = await sharp(buffer)
        .resize(800, 800, { // Max 800x800, maintains aspect ratio
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 80, // 80% quality (0-100)
          progressive: true // Progressive JPEG for faster loading
        })
        .toBuffer();

      console.log(`📊 Original size: ${buffer.length} bytes`);
      console.log(`📊 Compressed size: ${compressedBuffer.length} bytes`);
      console.log(`✅ Reduced by: ${((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1)}%`);

      const fileName = `${userId}.jpg`;

      // Delete old image if exists
      if (userProfile.ProfilePicture) {
        const oldKey = userProfile.ProfilePicture.split(".com/")[1]?.split('?')[0];
        if (oldKey) await this.uploadService.deleteFile(oldKey);
      }

      // Upload compressed image
      const uploaded = await this.uploadService.uploadFile(
        compressedBuffer, // Use compressed buffer
        "profiles",
        fileName,
        "no-cache, no-store, must-revalidate"
      );

      // ✅ Add timestamp for cache busting
      const timestamp = Date.now();
      const imageUrl = uploaded.publicUrl || uploaded.url;
      userProfile.ProfilePicture = `${imageUrl}?v=${timestamp}`;
    }

    // ✅ Remove image
    if (imageChanged && !dto.ProfilePicture) {
      if (userProfile.ProfilePicture) {
        const oldKey = userProfile.ProfilePicture.split(".com/")[1]?.split('?')[0];
        if (oldKey) await this.uploadService.deleteFile(oldKey);
      }
      userProfile.ProfilePicture = '';
    }

    // ✅ Update fields
    userProfile.name = dto.name ?? userProfile.name;
    userProfile.bio = dto.bio ?? userProfile.bio;
    userProfile.url = dto.url ?? userProfile.url;

    await this.userProfileRepository.save(userProfile);

    // ✅ Update username
    if (dto.username) {
      const exists = await this.userRepository.findOne({ where: { username: dto.username } });
      if (exists && exists.id !== user.id) throw new BadRequestException("Username already taken");

      user.username = dto.username;
      await this.userRepository.save(user);
    }

    // ✅ Fetch updated data
    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userProfile"],
    });

    if (!updatedUser) throw new NotFoundException('User not found');

    return {
      success: true,
      message: "Profile updated successfully",
      data: {
        username: updatedUser.username,
        name: updatedUser.userProfile.name,
        bio: updatedUser.userProfile.bio,
        url: updatedUser.userProfile.url,
        ProfilePicture: updatedUser.userProfile.ProfilePicture,
      },
    };
  }

  async checkUsername(username: string) {
    const user = await this.userRepository.findOne({ where: { username } });
    return { available: !user };
  }

  // async allUusersDetails() {
  //   const users = await this.userRepository.find({ relations: ['userProfile', 'videos', 'followers', 'following'], });

  //   if (!users || users.length === 0) {
  //     return { success: false, message: 'No users found' };
  //   }

  //   return users;
  //   // return { success: true, message: 'Profile updated successfully',dataUri: userProfile.url};
  // }
  // async allUusersDetails() {
  //   const users = await this.userRepository.find({
  //     relations: {
  //       userProfile: true,
  //       followers: true,
  //       following: true,
  //       videos: {
  //         likes: true,
  //         views: true,
  //         comments: true,
  //         hashtags: true,
  //         mentions: true,
  //         reports: true,
  //       },
  //     },
  //   });

  //   if (!users || users.length === 0) {
  //     return { success: false, message: 'No users found' };
  //   }

  //   return users
  // }

  // for admin panel api
  async allUsersDetails(
    page = 1,
    limit = 10,
    search?: string
  ) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userProfile', 'profile')
      .leftJoinAndSelect('user.followers', 'followers')
      .leftJoinAndSelect('user.following', 'following')
      .leftJoinAndSelect('user.videos', 'videos')
      .leftJoinAndSelect('videos.likes', 'likes')
      .leftJoinAndSelect('videos.views', 'views')
      .leftJoinAndSelect('videos.comments', 'comments')
      .leftJoinAndSelect('videos.hashtags', 'hashtags')
      .leftJoinAndSelect('videos.mentions', 'mentions')
      .leftJoinAndSelect('videos.reports', 'reports');

    // 🔍 GLOBAL SEARCH (FULL DB)
    if (search) {
      qb.andWhere(
        `
    profile.name ILIKE :search
    OR user.username ILIKE :search
    OR user.email ILIKE :search
    OR user.phone_no ILIKE :search
    `,
        { search: `%${search}%` }
      );
    }


    // 🔢 Total count (with search)
    const totalCount = await qb.getCount();

    // 📄 Pagination
    qb.skip((page - 1) * limit).take(limit);

    const users = await qb.getMany();

    return {
      success: true,
      data: users,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      pageSize: limit,
    };
  }


  // videos.service.ts
  async getAllVideos(
    page = 1,
    limit = 10,
    search?: string,
    hashtag?: string,
    startDate?: string,
    endDate?: string,
    videoType?: string
  ) {
    const qb = this.videoRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.user_id', 'user')
      .leftJoinAndSelect('user.userProfile', 'profile')
      .leftJoinAndSelect('video.likes', 'likes')
      .leftJoinAndSelect('video.views', 'views')
      .leftJoinAndSelect('video.comments', 'comments')
      .leftJoinAndSelect('video.hashtags', 'hashtags')
      .leftJoinAndSelect('video.mentions', 'mentions')
      .leftJoinAndSelect('video.reports', 'reports');

    //  IMPORTANT: Exclude stories and archived
    qb.where('video.type != :storyType', { storyType: 'story' });
    qb.andWhere('(video.archived IS NULL OR video.archived = :archived)', { archived: false });

    // 🔍 USERNAME/EMAIL SEARCH
    if (search) {
      qb.andWhere(
        `(
        user.username ILIKE :search
        OR user.email ILIKE :search
        OR profile.name ILIKE :search
      )`,
        { search: `%${search}%` }
      );
    }

    //  HASHTAG FILTER (FIXED - with proper join)
    if (hashtag) {
      qb.andWhere(
        `EXISTS (
        SELECT 1 FROM video_hashtags_hashtag vh
        INNER JOIN hashtag h ON vh."hashtagId" = h.id
        WHERE vh."videoUuid" = video.uuid
        AND h.tag ILIKE :hashtag
      )`,
        { hashtag: `%${hashtag}%` }
      );
    }

    // VIDEO TYPE FILTER
    if (videoType && (videoType === 'reels' || videoType === 'news')) {
      qb.andWhere('video.type = :videoType', { videoType });
    }

    // DATE RANGE FILTER
    if (startDate && endDate) {
      qb.andWhere('video.created_at BETWEEN :startDate AND :endDate', {
        startDate: `${startDate} 00:00:00`,
        endDate: `${endDate} 23:59:59`,
      });
    } else if (startDate) {
      qb.andWhere('video.created_at >= :startDate', {
        startDate: `${startDate} 00:00:00`,
      });
    } else if (endDate) {
      qb.andWhere('video.created_at <= :endDate', {
        endDate: `${endDate} 23:59:59`,
      });
    }

    // Sort by newest first
    qb.orderBy('video.created_at', 'DESC');

    // Get total count BEFORE pagination
    const totalCount = await qb.getCount();

    // Apply pagination
    qb.skip((page - 1) * limit).take(limit);

    // Get videos
    const videos = await qb.getMany();

    return {
      success: true,
      data: videos,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      pageSize: limit,
    };
  }


  async editUserRole(userId: string, newRole: UserRole) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!Object.values(UserRole).includes(newRole)) {
      throw new BadRequestException('Invalid role');
    }

    user.role = newRole;
    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }


  // ===========================================================

  async getCurrentUser(userId: string) {
    // const user = await this.userRepository.findOneBy({ id: userId }) ;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userProfile'],

    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, userProfile: user };
  }

  // async getProfileByUsername(username: string, reqSenderUserId: string) {
  //   console.log('🔍 getProfileByUsername called for:', username);

  //   // Step 1: Get user info with profile
  //   const user = await this.userRepository
  //     .createQueryBuilder('user')
  //     .leftJoinAndSelect('user.userProfile', 'userProfile')
  //     .where('user.username = :username', { username })
  //     .getOne();

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   const userId = user.id;
  //   console.log(' User found:', userId, user.username);

  //   // Step 2: Followers (who follows this user)
  //   const followers = await this.followRepository
  //     .createQueryBuilder('follow')
  //     .leftJoin('follow.follower', 'follower')
  //     .leftJoin('follower.userProfile', 'followerProfile')
  //     .select([
  //       'follower.id AS id',
  //       'follower.username AS username',
  //       'followerProfile.name AS name',
  //       'followerProfile.ProfilePicture AS ProfilePicture'
  //     ])
  //     .where('follow.followingId = :userId', { userId })
  //     .getRawMany();
  //   // Step 3: Followings (whom this user follows)
  //   const followings = await this.followRepository
  //     .createQueryBuilder('follow')
  //     .leftJoin('follow.following', 'following')
  //     .leftJoin('following.userProfile', 'followingProfile')
  //     .select([
  //       'following.id AS id',
  //       'following.username AS username',
  //       'followingProfile.name AS name',
  //       'followingProfile.ProfilePicture AS ProfilePicture'
  //     ])
  //     .where('follow.followerId = :userId', { userId })
  //     .getRawMany();

  //   const myFollowings = await this.followRepository
  //     .createQueryBuilder('follow')
  //     .select('follow.followingId', 'followingId')
  //     .where('follow.followerId = :reqSenderUserId', { reqSenderUserId })
  //     .getRawMany();

  //   const myFollowingSet = new Set(
  //     myFollowings.map(f => f.followingId)
  //   );
  //   const followersWithFlag = followers.map(follower => ({
  //     ...follower,
  //     followedByMe: myFollowingSet.has(follower.id)
  //   }));
  //   const followingsWithFlag = followings.map(following => ({
  //     ...following,
  //     followedByMe: myFollowingSet.has(following.id)
  //   }));
  //   console.log('Followings:', followingsWithFlag);
  //   // Step 4: Fetch user’s videos
  //   const videos = await this.videoRepository
  //     .createQueryBuilder('video')
  //     .leftJoinAndSelect('video.audio', 'audio')
  //     .leftJoinAndSelect('video.hashtags', 'hashtags')
  //     .leftJoinAndSelect('video.likes', 'likes')
  //     .leftJoinAndSelect('video.views', 'views')
  //     .leftJoinAndSelect('views.user', 'viewUser')
  //     .leftJoinAndSelect('video.shares', 'shares')
  //     .leftJoinAndSelect('video.comments', 'comments')
  //     .leftJoinAndSelect('likes.user', 'likeUser')
  //     .where('video.user_id = :userId', { userId })
  //     .andWhere('video.type != :type', { type: 'story' })
  //     .orderBy('video.created_at', 'DESC')
  //     .getMany();

  //   const mentionedVideos = await this.videoRepository
  //     .createQueryBuilder('video')
  //     .leftJoinAndSelect('video.user_id', 'owner') // video owner
  //     .leftJoinAndSelect('owner.userProfile', 'ownerProfile')
  //     .leftJoinAndSelect('video.audio', 'audio')
  //     .leftJoinAndSelect('video.hashtags', 'hashtags')
  //     .leftJoinAndSelect('video.likes', 'likes')
  //     .leftJoinAndSelect('video.views', 'views')
  //     .leftJoinAndSelect('views.user', 'viewUser')
  //     .leftJoinAndSelect('video.shares', 'shares')
  //     .leftJoinAndSelect('likes.user', 'likeUser')
  //     .leftJoinAndSelect('video.comments', 'comments')

  //     .leftJoin('video.mentions', 'mention')
  //     .where('mention.id = :userId', { userId })
  //     .andWhere('video.type != :type', { type: 'story' })
  //     .orderBy('video.created_at', 'DESC')
  //     .getMany();

  //   console.log('🎥 Videos found:', videos.length);
  //   console.log('🎥 Mentioned videos found:', mentionedVideos.length);
  //   console.log('📊 Followers count:', followers.length);
  //   console.log('📊 Followings count:', followings.length);

  //   const formattedVideos = videos.map(video => ({
  //     ...video,
  //     isLiked: video.likes?.some(like => like.user?.id === reqSenderUserId) || false,
  //     isViewed: video.views?.some(view => view.user?.id === reqSenderUserId) || false,
  //     likesCount: video.likes?.length || 0,
  //     commentsCount: video.comments?.length || 0,
  //     viewsCount: video.views?.length || 0,
  //     sharesCount: video.shares?.length || 0
  //   }));
  //   // Step 4: Final response
  //   return {
  //     id: user.id,
  //     username: user.username,
  //     email: user.email,
  //     phone_no: user.phone_no,
  //     role: user.role,
  //     userProfile: user.userProfile,
  //     followersWithFlag,
  //     followingsWithFlag,
  //     videos: formattedVideos,
  //     mentionedVideos
  //   };
  // }

  async getProfileByUsername(username: string, reqSenderUserId: string) {
    console.log('🔍 getProfileByUsername called for:', username);

    // Step 1: Get user info with profile
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userProfile', 'userProfile')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userId = user.id;
    console.log('✅ User found:', userId, user.username);

    // Step 2: Followers (who follows this user)
    const followers = await this.followRepository
      .createQueryBuilder('follow')
      .leftJoin('follow.follower', 'follower')
      .leftJoin('follower.userProfile', 'followerProfile')
      .select([
        'follower.id AS id',
        'follower.username AS username',
        'followerProfile.name AS name',
        'followerProfile.ProfilePicture AS ProfilePicture'
      ])
      .where('follow.followingId = :userId', { userId })
      .getRawMany();

    // Step 3: Followings (whom this user follows)
    const followings = await this.followRepository
      .createQueryBuilder('follow')
      .leftJoin('follow.following', 'following')
      .leftJoin('following.userProfile', 'followingProfile')
      .select([
        'following.id AS id',
        'following.username AS username',
        'followingProfile.name AS name',
        'followingProfile.ProfilePicture AS ProfilePicture'
      ])
      .where('follow.followerId = :userId', { userId })
      .getRawMany();

    // Get all users that reqSenderUserId follows
    const myFollowings = await this.followRepository
      .createQueryBuilder('follow')
      .select('follow.followingId', 'followingId')
      .where('follow.followerId = :reqSenderUserId', { reqSenderUserId })
      .getRawMany();

    // Get all users that follow reqSenderUserId (for followsMe flag)
    const myFollowers = await this.followRepository
      .createQueryBuilder('follow')
      .select('follow.followerId', 'followerId')
      .where('follow.followingId = :reqSenderUserId', { reqSenderUserId })
      .getRawMany();

    const myFollowingSet = new Set(
      myFollowings.map(f => f.followingId)
    );

    const myFollowersSet = new Set(
      myFollowers.map(f => f.followerId)
    );

    // Add both flags: followedByMe AND followsMe
    const followersWithFlag = followers.map(follower => ({
      ...follower,
      followedByMe: myFollowingSet.has(follower.id),
      followsMe: myFollowersSet.has(follower.id)  //  CORRECT: Check if follower follows ME
    }));

    const followingsWithFlag = followings.map(following => ({
      ...following,
      followedByMe: myFollowingSet.has(following.id),
      followsMe: myFollowersSet.has(following.id)  //  CORRECT: Check if following follows ME back
    }));

    console.log('✅ Followings:', followingsWithFlag);
    console.log('✅ Followers with flags:', followersWithFlag);

    // Step 4: Fetch user's videos
    const videos = await this.videoRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.audio', 'audio')
      .leftJoinAndSelect('video.hashtags', 'hashtags')
      .leftJoinAndSelect('video.likes', 'likes')
      .leftJoinAndSelect('video.views', 'views')
      .leftJoinAndSelect('views.user', 'viewUser')
      .leftJoinAndSelect('video.shares', 'shares')
      .leftJoinAndSelect('video.comments', 'comments')
      .leftJoinAndSelect('likes.user', 'likeUser')
      .where('video.user_id = :userId', { userId })
      .andWhere('video.type != :type', { type: 'story' })
      .orderBy('video.created_at', 'DESC')
      .getMany();

    const mentionedVideos = await this.videoRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.user_id', 'owner')
      .leftJoinAndSelect('owner.userProfile', 'ownerProfile')
      .leftJoinAndSelect('video.audio', 'audio')
      .leftJoinAndSelect('video.hashtags', 'hashtags')
      .leftJoinAndSelect('video.likes', 'likes')
      .leftJoinAndSelect('video.views', 'views')
      .leftJoinAndSelect('views.user', 'viewUser')
      .leftJoinAndSelect('video.shares', 'shares')
      .leftJoinAndSelect('likes.user', 'likeUser')
      .leftJoinAndSelect('video.comments', 'comments')
      .leftJoin('video.mentions', 'mention')
      .where('mention.id = :userId', { userId })
      .andWhere('video.type != :type', { type: 'story' })
      .orderBy('video.created_at', 'DESC')
      .getMany();

    console.log('🎥 Videos found:', videos.length);
    console.log('🎥 Mentioned videos found:', mentionedVideos.length);
    console.log('📊 Followers count:', followers.length);
    console.log('📊 Followings count:', followings.length);

    const formattedVideos = videos.map(video => ({
      ...video,
      isLiked: video.likes?.some(like => like.user?.id === reqSenderUserId) || false,
      isViewed: video.views?.some(view => view.user?.id === reqSenderUserId) || false,
      likesCount: video.likes?.length || 0,
      commentsCount: video.comments?.length || 0,
      viewsCount: video.views?.length || 0,
      sharesCount: video.shares?.length || 0
    }));

    // Step 5: Final response
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone_no: user.phone_no,
      role: user.role,
      userProfile: user.userProfile,
      followersWithFlag,
      followingsWithFlag,
      videos: formattedVideos,
      mentionedVideos
    };
  }

  async searchUsers(query?: string) {
    const users = await this.userRepository.find({
      where: { username: Like(`%${query}%`), },
      relations: ['userProfile']
    });

    if (!users) {
      console.log('No users found');
    }

    return users
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

  async getFollowState() {

  }
}


