// import { Injectable } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Otp } from './entities/otp.entity';

// @Injectable()
// export class OtpCleanupService {
//   constructor(
//     @InjectRepository(Otp)
//     private otpRepository: Repository<Otp>,
//   ) {}

//   @Cron(CronExpression.EVERY_MINUTE)
//   async handleExpiredOtps() {
//     const now = new Date();
//     await this.otpRepository
//       .createQueryBuilder()
//       .delete()
//       .from(Otp)
//       .where('expiresAt < :now', { now })
//       .execute();
//   }
// }
