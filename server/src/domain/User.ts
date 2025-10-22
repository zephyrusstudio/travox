import { UserRole } from '../models/FirestoreTypes';

export interface UserPreferences {
  timezone?: string;
  locale?: string;
  dateFormat?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export class User {
    constructor(
        public id: string,
        public orgId?: string,
        public name?: string,
        public email?: string,
        public phone?: string,
        public googleId?: string,
        public avatar?: string,
        public role: UserRole = UserRole.ADMIN,
        public isActive: boolean = false,
        public preferences: UserPreferences = {},
        public lastLoginAt?: Date,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) { }

    static createFromGoogle(orgId: string, email: string, name: string, googleId: string, avatar?: string): User {
        const now = new Date();
        return new User('', orgId, name, email, undefined, googleId, avatar, UserRole.ADMIN, true, {}, undefined, now, now);
    }

    updateProfile(name?: string, phone?: string): void {
        this.name = name;
        this.phone = phone;
        this.updatedAt = new Date();
    }

    updatePreferences(preferences: Partial<UserPreferences>): void {
        this.preferences = { ...this.preferences, ...preferences };
        this.updatedAt = new Date();
    }

    activate(): void {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    deactivate(): void {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    setRole(role: UserRole): void {
        this.role = role;
        this.updatedAt = new Date();
    }

    hasRole(role: UserRole): boolean {
        return this.role === role;
    }

    hasAnyRole(roles: UserRole[]): boolean {
        return roles.includes(this.role);
    }

    recordLogin(): void {
        this.lastLoginAt = new Date();
        this.updatedAt = new Date();
    }

    canAccess(resource: string, action: string): boolean {
        // Owner can access everything
        if (this.hasRole(UserRole.OWNER)) {
            return true;
        }

        // Admin can access most things except owner functions
        if (this.hasRole(UserRole.ADMIN)) {
            return !this.isOwnerOnlyResource(resource, action);
        }

        // Define access rules for other roles
        return this.checkRoleBasedAccess(resource, action);
    }

    private isOwnerOnlyResource(resource: string, action: string): boolean {
        const ownerOnly = [
            'users.assign_owner_role',
            'organization.delete',
            'organization.transfer_ownership'
        ];
        
        // All audit log operations are owner-only
        if (resource === 'audit-logs') {
            return true;
        }
        
        return ownerOnly.includes(`${resource}.${action}`);
    }

    private checkRoleBasedAccess(resource: string, action: string): boolean {
        const accessMatrix: Record<UserRole, string[]> = {
            [UserRole.OWNER]: ['*'], // All access including audit logs and admin permissions
            [UserRole.ADMIN]: ['users.*', 'customers.*', 'vendors.*', 'bookings.*', 'payments.*', 'reports.*', 'files.*'] // All admin functions but no audit logs
        };

        const permissions = accessMatrix[this.role] || [];
        if (permissions.includes('*') || 
            permissions.includes(`${resource}.*`) || 
            permissions.includes(`${resource}.${action}`)) {
            return true;
        }

        return false;
    }

    // Get user data for API response with optional unmasking of sensitive fields
    toApiResponse(unmask: boolean = false): any {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            role: this.role,
            isActive: this.isActive,
            preferences: unmask ? this.preferences : undefined,
            lastLoginAt: unmask ? this.lastLoginAt : undefined,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
