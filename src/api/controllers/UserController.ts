import { Request, Response } from 'express';
import { container } from '../../config/container';
import { ManageUserRoles } from '../../application/ManageUserRoles';
import { IUserRepository } from '../../application/Repositories/IUserRepository';
import { UserRole } from '../../models/FirestoreTypes';

export class UserController {
  async assignRoles(req: Request, res: Response) {
    try {
      const useCase = container.resolve(ManageUserRoles);
      const { userId, roles } = req.body;
      
      if (!userId || !roles || !Array.isArray(roles)) {
        return res.status(400).json({ message: 'userId and roles array are required' });
      }

      // Validate roles
      for (const role of roles) {
        if (!Object.values(UserRole).includes(role)) {
          return res.status(400).json({ message: `Invalid role: ${role}` });
        }
      }

      const user = await useCase.assignRoles(
        { userId, roles },
        req.user?.orgId!,
        req.user?.id!
      );
      
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async addRole(req: Request, res: Response) {
    try {
      const useCase = container.resolve(ManageUserRoles);
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role || !Object.values(UserRole).includes(role)) {
        return res.status(400).json({ message: 'Valid role is required' });
      }

      const user = await useCase.addRole(userId, role, req.user?.orgId!, req.user?.id!);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async removeRole(req: Request, res: Response) {
    try {
      const useCase = container.resolve(ManageUserRoles);
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role || !Object.values(UserRole).includes(role)) {
        return res.status(400).json({ message: 'Valid role is required' });
      }

      const user = await useCase.removeRole(userId, role, req.user?.orgId!, req.user?.id!);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const userRepo = container.resolve<IUserRepository>('IUserRepository');
      const users = await userRepo.findByOrganizationId(req.user?.orgId!);
      
      // Remove sensitive information
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      res.json(sanitizedUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const userRepo = container.resolve<IUserRepository>('IUserRepository');
      const user = await userRepo.findById(req.params.id);
      
      if (!user || user.orgId !== req.user?.orgId) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove sensitive information
      const sanitizedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        isActive: user.isActive,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.json(sanitizedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async activate(req: Request, res: Response) {
    try {
      const useCase = container.resolve(ManageUserRoles);
      const user = await useCase.activateUser(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json({ message: 'User activated successfully', user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deactivate(req: Request, res: Response) {
    try {
      const useCase = container.resolve(ManageUserRoles);
      const user = await useCase.deactivateUser(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json({ message: 'User deactivated successfully', user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userRepo = container.resolve<IUserRepository>('IUserRepository');
      const user = await userRepo.findById(req.user?.id!);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove sensitive information
      const sanitizedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        isActive: user.isActive,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.json(sanitizedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userRepo = container.resolve<IUserRepository>('IUserRepository');
      const user = await userRepo.findById(req.user?.id!);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { name, phone, preferences } = req.body;
      
      if (name) user.updateProfile(name, phone);
      if (preferences) user.updatePreferences(preferences);

      await userRepo.update(user);
      
      // Remove sensitive information
      const sanitizedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        isActive: user.isActive,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.json(sanitizedUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
