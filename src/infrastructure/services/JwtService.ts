

import { injectable } from 'tsyringe';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IJwtService } from '../../application/services/IJwtService';

const ACCESS_TOKEN_LIFETIME = process.env.ACCESS_TOKEN_LIFETIME || '15m'; // e.g., 15m
const REFRESH_TOKEN_LIFETIME = process.env.REFRESH_TOKEN_LIFETIME || '30d'; // e.g., 30d
const JWT_ALGORITHM = 'RS256';

@injectable()
export class JwtService implements IJwtService {
    private privateKey: string;
    private publicKey: string;

    constructor() {
        this.privateKey = process.env.JWT_PRIVATE_KEY!;
        this.publicKey = process.env.JWT_PUBLIC_KEY!;
    }

    signAccessToken(payload: object): string {
        const options: SignOptions = {
            algorithm: JWT_ALGORITHM,
            expiresIn: this.parseTimeToMs(ACCESS_TOKEN_LIFETIME),
            issuer: process.env.JWT_ISSUER || 'https://auth.example.com',
        };
        return jwt.sign(payload, this.privateKey, options);
    }

    signRefreshToken(payload: object): string {
        const options: SignOptions = {
            algorithm: JWT_ALGORITHM,
            expiresIn: this.parseTimeToMs(REFRESH_TOKEN_LIFETIME),
            issuer: process.env.JWT_ISSUER || 'https://auth.example.com',
        };
        return jwt.sign(payload, this.privateKey, options);
    }

    getRefreshTokenExpiryDate(): Date {
        const expiresInMs = this.parseTimeToMs(REFRESH_TOKEN_LIFETIME);
        return new Date(Date.now() + expiresInMs);
    }

    verify(token: string): any {
        return jwt.verify(token, this.publicKey, {
            algorithms: [JWT_ALGORITHM],
            issuer: process.env.JWT_ISSUER || 'https://auth.example.com',
        });
    }

    // Utility to parse time string (e.g. 30d) to milliseconds
    private parseTimeToMs(time: string): number {
        const match = /^(\d+)([smhd])$/.exec(time);
        if (!match) throw new Error('Invalid token lifetime format');
        const [, value, unit] = match;
        const n = parseInt(value, 10);
        switch (unit) {
            case 's': return n * 1000;
            case 'm': return n * 60 * 1000;
            case 'h': return n * 60 * 60 * 1000;
            case 'd': return n * 24 * 60 * 60 * 1000;
            default: throw new Error('Unknown time unit');
        }
    }
}
