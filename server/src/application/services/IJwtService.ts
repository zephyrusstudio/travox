export interface CookieConfig {
	httpOnly: boolean;
	secure: boolean;
	sameSite: 'strict' | 'lax' | 'none';
	domain?: string;
	expires: Date;
}

export interface IJwtService {
	signAccessToken(payload: object): string;
	signRefreshToken(payload: object): string;
	getAccessTokenExpiryDate(): Date;
	getRefreshTokenExpiryDate(): Date;
	getCookieConfig(tokenType: 'access' | 'refresh'): CookieConfig;
	verify<T = any>(token: string): T | null;
}
