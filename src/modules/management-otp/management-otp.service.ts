import { Injectable,BadRequestException,Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,MoreThan,FindOptionsWhere } from 'typeorm';
import { ManagementOtp } from './entities/management-otp.entity';

@Injectable()
export class ManagementOtpService {
  private readonly logger = new Logger(ManagementOtpService.name);
  constructor(
    @InjectRepository(ManagementOtp)
    private otpRepository: Repository<ManagementOtp>,
  ) {}

  async generateOtp(params: { email?: string; phone?: string }): Promise<string> {
  const { email, phone } = params;

  if (!email && !phone) {
    throw new BadRequestException('Must provide userId or email/phone_no');
  }

  const whereConditions: FindOptionsWhere<ManagementOtp>[] = [];
  if (email) whereConditions.push({ email });
  if (phone) whereConditions.push({phone});

  const existingOtp = await this.otpRepository.findOne({
    where: whereConditions.map(cond => ({
      ...cond,
      expiresAt: MoreThan(new Date()),
    })),
  });

  if (existingOtp) {
    throw new BadRequestException("You can't request OTP again within 1 minute");
  }
  await this.otpRepository.delete({  email, phone });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const otp = this.otpRepository.create({
    email,
    phone,
    otp:code,
    expiresAt,
  });

  await this.otpRepository.save(otp);
  setTimeout(async () => {
    await this.otpRepository
  .createQueryBuilder()
  .delete()
  .from(ManagementOtp)
  .orWhere("email = :email", { email })
  .orWhere("phone = :phone", { phone })
  .execute();

    this.logger?.log(`OTP cleanup done after 1 minute`);
  }, 60 * 1000);

  return code;
}




  async validateOtp(params: { email?: string; phone?: string; code: string }): Promise<boolean> {
  const { email, phone, code } = params;

  if (!email && !phone) {
    throw new BadRequestException('Must provide userId or email/phone_no');
  }

  const whereConditions: FindOptionsWhere<ManagementOtp>[] = [];
  if (email) whereConditions.push({ email });
  if (phone) whereConditions.push({ phone });

  const latestOtp = await this.otpRepository.findOne({
    where: whereConditions,
    order: { createdAt: 'DESC' },
  });

  if (!latestOtp) return false;
  if (latestOtp.otp !== code) return false;
  if (latestOtp.expiresAt < new Date()) return false;

  await this.otpRepository.delete({ id: latestOtp.id });
  return true;
}

}
