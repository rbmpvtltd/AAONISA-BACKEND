import { Injectable } from '@nestjs/common';

interface OtpEntry {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService {
  private otpStore = new Map<string, OtpEntry>(); // key: identifier (e.g., phone/email)

  generateOtp(identifier: string): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute from now

    this.otpStore.set(identifier, { code: otp, expiresAt });
    return otp;
  }

  validateOtp(identifier: string, code: string): boolean {
    const entry = this.otpStore.get(identifier);

    if (!entry) return false;
    if (entry.code !== code) return false;
    if (entry.expiresAt < new Date()) {
      this.otpStore.delete(identifier); // clean up expired
      return false;
    }

    this.otpStore.delete(identifier); // use-once
    return true;
  }
}
