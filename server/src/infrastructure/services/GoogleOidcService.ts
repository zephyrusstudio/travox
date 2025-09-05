import { injectable } from 'tsyringe';
import { OAuth2Client } from 'google-auth-library';
import { IGoogleOidcService } from '../../application/services/IGoogleOidcService';

@injectable()
export class GoogleOidcService implements IGoogleOidcService {
    private client: OAuth2Client;
    private allowedDomains: string[];

    constructor() {
        const clientId = process.env.OAUTH_CLIENT_ID;
        if (!clientId) {
            throw new Error('OAUTH_CLIENT_ID environment variable is required');
        }

        this.client = new OAuth2Client(clientId);
        
        // Parse allowed domains from environment variable (comma-separated)
        // e.g., OAUTH_ALLOWED_DOMAINS="perccent.com,example.com" or leave empty for any domain
        const allowedDomainsEnv = process.env.OAUTH_ALLOWED_DOMAINS;
        this.allowedDomains = allowedDomainsEnv 
            ? allowedDomainsEnv.split(',').map(domain => domain.trim().toLowerCase())
            : [];
    }

    async verifyIdToken(idToken: string): Promise<{
        email: string;
        name: string;
        googleId: string;
        emailVerified: boolean;
        picture?: string;
    } | null> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: process.env.OAUTH_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload) {
                return null;
            }

            const { 
                sub: googleId, 
                email, 
                name, 
                email_verified: emailVerified,
                picture 
            } = payload;

            if (!email || !name || !googleId) {
                return null;
            }

            // Check if email domain is allowed (if domain allowlist is configured)
            if (!this.isDomainAllowed(email)) {
                throw new Error(`Email domain not allowed. Only users from allowed domains can sign in.`);
            }

            return {
                email,
                name,
                googleId,
                emailVerified: emailVerified === true,
                picture,
            };
        } catch (error) {
            console.error('Google ID token verification failed:', error);
            return null;
        }
    }

    isDomainAllowed(email: string): boolean {
        // If no domains are configured, allow any domain
        if (this.allowedDomains.length === 0) {
            return true;
        }

        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!emailDomain) {
            return false;
        }

        return this.allowedDomains.includes(emailDomain);
    }
}
