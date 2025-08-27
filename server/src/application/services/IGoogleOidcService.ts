export interface IGoogleOidcService {
    /**
     * Verify Google ID token and extract user information
     * @param idToken - Google ID token from client
     * @returns Promise with user info or null if invalid
     */
    verifyIdToken(idToken: string): Promise<{
        email: string;
        name: string;
        googleId: string;
        emailVerified: boolean;
        picture?: string;
    } | null>;

    /**
     * Check if email domain is allowed (for domain allowlist)
     * @param email - Email to check
     * @returns boolean indicating if domain is allowed
     */
    isDomainAllowed(email: string): boolean;
}
