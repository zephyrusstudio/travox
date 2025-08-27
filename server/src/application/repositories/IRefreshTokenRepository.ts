export interface IRefreshTokenRepository {
	store(payload: { userId: string; token: string; expiresAt: Date }): Promise<void>;
	revoke(token: string): Promise<void>;
	isRevoked(token: string): Promise<boolean>;
}
