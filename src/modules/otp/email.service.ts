// src/common/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendOtp(to: string, otp: string) {
    const mailOptions = {
      from: `"Hithoy" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your OTP Code',
      text: `Your HitHoy verification code is ${otp}. Welcome to ROTARY BALAJI MEDIA PRIVATE LIMITED.`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP sent to email: ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP email: ${err.message}`);
      throw err;
    }
  }
}
