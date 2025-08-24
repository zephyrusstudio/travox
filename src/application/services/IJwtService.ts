export interface IJwtService {
	signAccessToken(payload: object): string;
	signRefreshToken(payload: object): string;
	getRefreshTokenExpiryDate(): Date;
	verify<T = any>(token: string): T | null;
}
