import { injectable } from 'tsyringe';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IJwtService } from '../../application/services/IJwtService';
import type { StringValue } from 'ms';

const ACCESS_TOKEN_LIFETIME = (process.env.ACCESS_TOKEN_LIFETIME || '15m') as StringValue; // e.g., 15m, 1h, 7d
const REFRESH_TOKEN_LIFETIME = (process.env.REFRESH_TOKEN_LIFETIME || '30d') as StringValue; // e.g., 30d
const JWT_ALGORITHM = 'RS256';

// Cookie configuration
// Note: COOKIE_DOMAIN should only be set for same-domain or subdomain setups (e.g., '.example.com')
// For cross-domain setups (e.g., app on vercel.app, API on render.com), leave COOKIE_DOMAIN unset
// The browser will automatically scope cookies to the API domain
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
// SameSite=None is required for cross-origin requests with credentials
const COOKIE_SAME_SITE: 'strict' | 'lax' | 'none' = 
    process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none' || 
    (process.env.NODE_ENV === 'production' ? 'none' : 'lax');

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
            expiresIn: ACCESS_TOKEN_LIFETIME,
            issuer: process.env.JWT_ISSUER || 'https://auth.example.com',
        };
        return jwt.sign(payload, this.privateKey, options);
    }

    signRefreshToken(payload: object): string {
        const options: SignOptions = {
            algorithm: JWT_ALGORITHM,
            expiresIn: REFRESH_TOKEN_LIFETIME,
            issuer: process.env.JWT_ISSUER || 'https://auth.example.com',
        };
        return jwt.sign(payload, this.privateKey, options);
    }

    getAccessTokenExpiryDate(): Date {
        const expiresInMs = this.parseTimeToMs(ACCESS_TOKEN_LIFETIME);
        return new Date(Date.now() + expiresInMs);
    }

    getRefreshTokenExpiryDate(): Date {
        const expiresInMs = this.parseTimeToMs(REFRESH_TOKEN_LIFETIME);
        return new Date(Date.now() + expiresInMs);
    }

    /**
     * Get cookie configuration for cross-domain cookies
     * @param tokenType 'access' | 'refresh'
     */
    getCookieConfig(tokenType: 'access' | 'refresh'): {
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'strict' | 'lax' | 'none';
        domain?: string;
        expires: Date;
    } {
        return {
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAME_SITE,
            domain: COOKIE_DOMAIN,
            expires: tokenType === 'access' 
                ? this.getAccessTokenExpiryDate() 
                : this.getRefreshTokenExpiryDate(),
        };
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
