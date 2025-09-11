// otp.service.ts
import { Injectable,BadRequestException,Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,MoreThan,FindOptionsWhere } from 'typeorm';
import { Otp } from './entities/otp.entity';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  async generateOtp(params: { userId?: string; email?: string; phone_no?: string }): Promise<string> {
  const { userId, email, phone_no } = params;

  if (!userId && !email && !phone_no) {
    throw new BadRequestException('Must provide userId or email/phone_no');
  }

  const whereConditions: FindOptionsWhere<Otp>[] = [];
  if (userId) whereConditions.push({ userId });
  if (email) whereConditions.push({ email });
  if (phone_no) whereConditions.push({ phone_no });

  const existingOtp = await this.otpRepository.findOne({
    where: whereConditions.map(cond => ({
      ...cond,
      expiresAt: MoreThan(new Date()),
    })),
  });

  if (existingOtp) {
    throw new BadRequestException("You can't request OTP again within 1 minute");
  }
  await this.otpRepository.delete({ userId, email, phone_no });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const otp = this.otpRepository.create({
    userId,
    email,
    phone_no,
    code,
    expiresAt,
  });

  await this.otpRepository.save(otp);
  setTimeout(async () => {
    await this.otpRepository.delete({ userId, email, phone_no });
    this.logger?.log(`OTP cleanup done after 1 minute`);
  }, 60 * 1000);

  return code;
}




  async validateOtp(params: { userId?: string; email?: string; phone_no?: string; code: string }): Promise<boolean> {
  const { userId, email, phone_no, code } = params;

  if (!userId && !email && !phone_no) {
    throw new BadRequestException('Must provide userId or email/phone_no');
  }

  const whereConditions: FindOptionsWhere<Otp>[] = [];
  if (userId) whereConditions.push({ userId });
  if (email) whereConditions.push({ email });
  if (phone_no) whereConditions.push({ phone_no });

  const latestOtp = await this.otpRepository.findOne({
    where: whereConditions,
    order: { createdAt: 'DESC' },
  });

  if (!latestOtp) return false;
  if (latestOtp.code !== code) return false;
  if (latestOtp.expiresAt < new Date()) return false;

  await this.otpRepository.delete({ id: latestOtp.id }); // Clean up after success
  return true;
}

}
