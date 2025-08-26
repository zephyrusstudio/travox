import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../repositories/IUserRepository';
import { User } from '../../../domain/User';
import { UserRole } from '../../../models/FirestoreTypes';

interface ChangeRoleDTO {
  userId: string;
  role: UserRole;
}

@injectable()
export class ManageUserRoles {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository
  ) {}

  async changeRole(data: ChangeRoleDTO, orgId: string, assignedBy: string): Promise<User> {
    // Validate that user exists and belongs to the organization
    const user = await this.userRepo.findById(data.userId);
    if (!user || user.orgId !== orgId) {
      throw new Error('User not found or does not belong to this organization');
    }

    // Get the user who is changing the role
    const assigningUser = await this.userRepo.findById(assignedBy);
    if (!assigningUser || assigningUser.orgId !== orgId) {
      throw new Error('Unauthorized: Invalid assigning user');
    }

    // Validate permissions
    this.validateRoleChangePermissions(assigningUser, data.role, user);

    // Change role
    user.setRole(data.role);

    // Update user in repository
    return await this.userRepo.update(user);
  }

  private validateRoleChangePermissions(assigningUser: User, newRole: UserRole, targetUser: User): void {
    // Only owners can assign owner roles
    if (newRole === UserRole.OWNER && !assigningUser.hasRole(UserRole.OWNER)) {
      throw new Error('Access denied: Only owners can assign owner roles');
    }

    // Only owners and admins can assign admin roles
    if (newRole === UserRole.ADMIN && !assigningUser.hasAnyRole([UserRole.OWNER, UserRole.ADMIN])) {
      throw new Error('Access denied: Only owners and admins can assign admin roles');
    }

    // Owners and admins can assign any other role
    if (!assigningUser.hasAnyRole([UserRole.OWNER, UserRole.ADMIN])) {
      throw new Error('Access denied: Only owners and admins can change user roles');
    }

    // Cannot change your own role to a lower privilege if you're the only owner
    if (assigningUser.id === targetUser.id && 
        assigningUser.hasRole(UserRole.OWNER) && 
        newRole !== UserRole.OWNER) {
      // This would require checking if there are other owners in the organization
      // For now, we'll allow it but this could be enhanced
    }
  }

  async getUsersByRole(role: UserRole, orgId: string): Promise<User[]> {
    const allUsers: User[] = await this.userRepo.findByOrganizationId(orgId);
    return allUsers.filter((user: User) => user.hasRole(role));
  }

  async getOrganizationRoleStats(orgId: string): Promise<Record<UserRole, number>> {
    const allUsers = await this.userRepo.findByOrganizationId(orgId);
    const stats: Record<UserRole, number> = {
      [UserRole.OWNER]: 0,
      [UserRole.ADMIN]: 0,
      [UserRole.OPS]: 0,
      [UserRole.FINANCE]: 0,
      [UserRole.AGENT]: 0,
      [UserRole.VIEWER]: 0
    };

    allUsers.forEach((user: User) => {
      if (stats[user.role] !== undefined) {
        stats[user.role]++;
      }
    });

    return stats;
  }

  async activateUser(userId: string, orgId: string, activatedBy: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user || user.orgId !== orgId) {
      throw new Error('User not found or does not belong to this organization');
    }

    const activatingUser = await this.userRepo.findById(activatedBy);
    if (!activatingUser || activatingUser.orgId !== orgId) {
      throw new Error('Unauthorized: Invalid activating user');
    }

    // Only owners and admins can activate users
    if (!activatingUser.hasAnyRole([UserRole.OWNER, UserRole.ADMIN])) {
      throw new Error('Access denied: Insufficient privileges to activate users');
    }

    if (user.isActive) {
      throw new Error('User is already active');
    }

    user.activate();
    return await this.userRepo.update(user);
  }

  async deactivateUser(userId: string, orgId: string, deactivatedBy: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user || user.orgId !== orgId) {
      throw new Error('User not found or does not belong to this organization');
    }

    const deactivatingUser = await this.userRepo.findById(deactivatedBy);
    if (!deactivatingUser || deactivatingUser.orgId !== orgId) {
      throw new Error('Unauthorized: Invalid deactivating user');
    }

    // Only owners and admins can deactivate users
    if (!deactivatingUser.hasAnyRole([UserRole.OWNER, UserRole.ADMIN])) {
      throw new Error('Access denied: Insufficient privileges to deactivate users');
    }

    // Cannot deactivate yourself
    if (userId === deactivatedBy) {
      throw new Error('Cannot deactivate yourself');
    }

    // Cannot deactivate the last owner
    if (user.hasRole(UserRole.OWNER)) {
      const owners = await this.getUsersByRole(UserRole.OWNER, orgId);
      if (owners.length <= 1) {
        throw new Error('Cannot deactivate the last owner in the organization');
      }
    }

    if (!user.isActive) {
      throw new Error('User is already inactive');
    }

    user.deactivate();
    return await this.userRepo.update(user);
  }
}
