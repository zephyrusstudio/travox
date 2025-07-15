export interface IOTPService {
    sendOtp(to: string, type: 'email' | 'sms'): Promise<void>;
    verifyOtp(to: string, code: string): Promise<boolean>;
}
