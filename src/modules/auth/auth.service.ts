// src/auth/auth.service.ts
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) { }


  async register(dto: RegisterDto, res: Response) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      username: dto.username,
      password: hashed,
      role: dto.role || UserRole.USER,
    });
    const savedUser = await this.usersRepo.save(user);

    // --- Generate Tokens ---
    const payload = { sub: savedUser.id, email: savedUser.email, username: savedUser.username, role: savedUser.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY_IN });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY_IN });
    savedUser.refreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.save(savedUser,);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ message: 'User registered successfully' });
  }


  async login(dto: LoginDto, res: Response) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY_IN });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY_IN });

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.save(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: 'Login successful' });
  }

  async logout(userId: string) {
    await this.usersRepo.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }


  async refreshToken(userId: string, oldRefreshToken: string) {
const payload: any = this.jwtService.verify(oldRefreshToken, { secret: process.env.REFRESH_TOKEN_SECRET });
    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.refreshToken !== oldRefreshToken) throw new BadRequestException('Invalid refresh token');

    const newAccessToken = this.jwtService.sign({ sub: user.id, email: user.email }, { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: process.env.ACCESS_TOKEN_EXPIRY_IN });
    const newRefreshToken = this.jwtService.sign({ sub: user.id, email: user.email }, { secret: process.env.REFRESH_TOKEN_SECRET, expiresIn: process.env.REFRESH_TOKEN_EXPIRY_IN });
    user.refreshToken = newRefreshToken;
    await this.usersRepo.save(user);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
  
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('No user found');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await this.usersRepo.save(user);

    // TODO: Send resetToken via email link 
    return { message: 'Reset link has been sent to your email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
const users = await this.usersRepo.find();

const user = users.find(u => u.resetToken && bcrypt.compareSync(dto.token, u.resetToken));

if (!user || (user.resetTokenExpiry && user.resetTokenExpiry < new Date())) {
  throw new UnauthorizedException('Invalid or expired token');
}
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await this.usersRepo.save(user);
    console.log('Password reset successfully' );
    
    return { message: 'Password reset successfully' };
  }
}
