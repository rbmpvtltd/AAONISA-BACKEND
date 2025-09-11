import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private smsApiUrl = 'https://www.fast2sms.com/dev/bulkV2';
  private smsApiKey =  process.env.SMS_API_KEY;

  async sendOtpSms(numbers: string, otpCode: string): Promise<void> {
    try {
      const payload = {
        route: 'dlt',
        sender_id: 'RBMPLA',
        template_id: '1707172620296899599',
        variables_values: otpCode,
        numbers: numbers,
        flash: '0',
        schedule_time: '',
        message: '181881',
      };

      const headers = {
        'Content-Type': 'application/json',
        authorization: this.smsApiKey,
      };

      const response = await axios.post(this.smsApiUrl, payload, { headers });

      this.logger.log(`SMS sent successfully: ${JSON.stringify(response.data)}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw error;
    }
  }
}
