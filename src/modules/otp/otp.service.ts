// otp.service.ts
import { Injectable,BadRequestException,Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,MoreThan } from 'typeorm';
import { Otp } from './entities/otp.entity';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  async generateOtp(userId: string): Promise<string> {
    
    const existingOtp = await this.otpRepository.findOne({
      where: {
        userId,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (existingOtp) {
      throw new BadRequestException("You can't send OTP again within 1 minute");
    }

    await this.otpRepository.delete({ userId });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const otp = this.otpRepository.create({ userId, code, expiresAt });
    await this.otpRepository.save(otp);
    setTimeout(async () => {
      await this.otpRepository.delete({ userId });
      this.logger.log(`OTP cleanup done for user ${userId} after 1 minute`);
    }, 60 * 1000);
    return code;
  }


  async validateOtp(userId: string, code: string): Promise<boolean> {
    const latestOtp = await this.otpRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!latestOtp) return false;
    if (latestOtp.code !== code) return false;
    if (latestOtp.expiresAt < new Date()) return false;
    // await this.otpRepository.delete(latestOtp.id);
    return true;
  }
}
