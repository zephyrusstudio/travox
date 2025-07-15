import { injectable, inject } from 'tsyringe';
import { IUserRepository } from './Repositories/IUserRepository';
import { IOTPService } from '../domain/IOTPService';

@injectable()
export class RegisterUser {
    constructor(
        @inject('IUserRepository') private users: IUserRepository,
        @inject('IOTPService') private otp: IOTPService
    ) { }

    async execute({ email, phone }: { email?: string; phone?: string }) {
        // Validate, create user (inactive), send OTP via IOTPService
        // No infra logic here—just orchestration
    }
}
