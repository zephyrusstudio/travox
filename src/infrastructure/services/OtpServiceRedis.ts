import { injectable } from 'tsyringe';
import { IOTPService } from '../../application/services/IOTPService';

@injectable()
export class OtpServiceRedis implements IOTPService {
    async sendOtp(to: string, type: 'email' | 'sms') {
        // Generate, store in Redis, call 3rd party (SendGrid, Twilio)
    }
    async verifyOtp(to: string, code: string): Promise<boolean> {
        // Retrieve from Redis, compare with provided code
        return true; // Placeholder for actual verification logic
    }
}
