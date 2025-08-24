import { injectable, inject } from 'tsyringe';
import { IUserRepository } from './Repositories/IUserRepository';
import { User } from '../domain/User';
import { UserRole } from '../models/FirestoreTypes';

interface AssignRoleDTO {
  userId: string;
  roles: UserRole[];
}

@injectable()
export class ManageUserRoles {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository
  ) {}

  async assignRoles(data: AssignRoleDTO, orgId: string, assignedBy: string): Promise<User> {
    // Validate that user exists and belongs to the organization
    const user = await this.userRepo.findById(data.userId);
    if (!user || user.orgId !== orgId) {
      throw new Error('User not found or does not belong to this organization');
    }

    // Get the user who is assigning roles
    const assigningUser = await this.userRepo.findById(assignedBy);
    if (!assigningUser || assigningUser.orgId !== orgId) {
      throw new Error('Unauthorized: Invalid assigning user');
    }

    // Validate permissions
    this.validateRoleAssignmentPermissions(assigningUser, data.roles, user);

    // Assign roles
    user.setRoles(data.roles);

    // Update user in repository
    return await this.userRepo.update(user);
  }

  async addRole(userId: string, role: UserRole, orgId: string, assignedBy: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user || user.orgId !== orgId) {
      throw new Error('User not found or does not belong to this organization');
    }

    const assigningUser = await this.userRepo.findById(assignedBy);
    if (!assigningUser || assigningUser.orgId !== orgId) {
      throw new Error('Unauthorized: Invalid assigning user');
    }

    this.validateRoleAssignmentPermissions(assigningUser, [role], user);

    user.addRole(role);
    return await this.userRepo.update(user);
  }

  async removeRole(userId: string, role: UserRole, orgId: string, removedBy: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user || user.orgId !== orgId) {
      throw new Error('User not found or does not belong to this organization');
    }

    const removingUser = await this.userRepo.findById(removedBy);
    if (!removingUser || removingUser.orgId !== orgId) {
      throw new Error('Unauthorized: Invalid removing user');
    }

    // Only owners and admins can remove roles
    if (!removingUser.hasAnyRole([UserRole.OWNER, UserRole.ADMIN])) {
      throw new Error('Access denied: Insufficient privileges to remove roles');
    }

    // Cannot remove owner role from yourself
    if (role === UserRole.OWNER && userId === removedBy) {
      throw new Error('Cannot remove owner role from yourself');
    }

    // Only owners can remove admin roles
    if (role === UserRole.ADMIN && !removingUser.hasRole(UserRole.OWNER)) {
      throw new Error('Access denied: Only owners can remove admin roles');
    }

    user.removeRole(role);
    return await this.userRepo.update(user);
  }

  private validateRoleAssignmentPermissions(assigningUser: User, roles: UserRole[], targetUser: User): void {
    // Super admin check - prevent role changes if no owner exists
    const hasOwnerRole = roles.includes(UserRole.OWNER);
    
    // Only owners can assign owner roles
    if (hasOwnerRole && !assigningUser.hasRole(UserRole.OWNER)) {
      throw new Error('Access denied: Only owners can assign owner roles');
    }

    // Only owners and admins can assign admin roles
    const hasAdminRole = roles.includes(UserRole.ADMIN);
    if (hasAdminRole && !assigningUser.hasAnyRole([UserRole.OWNER, UserRole.ADMIN])) {
      throw new Error('Access denied: Only owners and admins can assign admin roles');
    }

    // Owners and admins can assign other roles
    if (!assigningUser.hasAnyRole([UserRole.OWNER, UserRole.ADMIN])) {
      throw new Error('Access denied: Insufficient privileges to assign roles');
    }

    // Cannot modify your own owner role (prevent lockout)
    if (assigningUser.id === targetUser.id && 
        assigningUser.hasRole(UserRole.OWNER) && 
        !roles.includes(UserRole.OWNER)) {
      throw new Error('Cannot remove owner role from yourself');
    }
  }

  async getUsersByRole(role: UserRole, orgId: string): Promise<User[]> {
    const allUsers = await this.userRepo.findByOrganizationId(orgId);
    return allUsers.filter((user: User) => user.hasRole(role));
  }

  async getAvailableRoles(): Promise<UserRole[]> {
    return Object.values(UserRole);
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
