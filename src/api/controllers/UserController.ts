import { Request, Response } from 'express';
import { container } from '../../config/container';
import { ManageUserRoles } from '../../application/User/ManageUserRoles';
import { IUserRepository } from '../../application/Repositories/IUserRepository';
import { UserRole } from '../../models/FirestoreTypes';

export class UserController {
  async changeRole(req: Request, res: Response) {
    try {
      const useCase = container.resolve(ManageUserRoles);
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'userId and role are required' }
        });
      }

      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          status: 'error',
          data: { message: `Invalid role: ${role}` }
        });
      }

      const user = await useCase.changeRole(
        { userId, role },
        req.user?.orgId!,
        req.user?.id!
      );
      
      res.json({
        status: 'success',
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
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
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      res.json({
        status: 'success',
        data: sanitizedUsers
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userRepo = container.resolve<IUserRepository>('IUserRepository');
      const user = await userRepo.findById(req.user?.id!);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'User not found' }
        });
      }
      
      // Remove sensitive information
      const sanitizedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.json({
        status: 'success',
        data: sanitizedUser
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async activate(req: Request, res: Response) {
    try {
      const useCase = container.resolve(ManageUserRoles);
      const user = await useCase.activateUser(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json({
        status: 'success',
        data: { message: 'User activated successfully', user }
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async deactivate(req: Request, res: Response) {
    try {
      const useCase = container.resolve(ManageUserRoles);
      const user = await useCase.deactivateUser(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json({
        status: 'success',
        data: { message: 'User deactivated successfully', user }
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const userRepo = container.resolve<IUserRepository>('IUserRepository');
      const user = await userRepo.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'User not found' }
        });
      }

      // Check if user belongs to the same organization
      if (user.orgId !== req.user?.orgId) {
        return res.status(403).json({
          status: 'error',
          data: { message: 'Access denied: User does not belong to your organization' }
        });
      }
      
      // Remove sensitive information
      const sanitizedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.json({
        status: 'success',
        data: sanitizedUser
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userRepo = container.resolve<IUserRepository>('IUserRepository');
      const user = await userRepo.findById(req.user?.id!);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'User not found' }
        });
      }

      const { name, phone, preferences } = req.body;
      
      if (name !== undefined) user.updateProfile(name, phone);
      if (preferences !== undefined) user.updatePreferences(preferences);

      const updatedUser = await userRepo.update(user);
      
      // Remove sensitive information
      const sanitizedUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        preferences: updatedUser.preferences,
        lastLoginAt: updatedUser.lastLoginAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };
      
      res.json({
        status: 'success',
        data: sanitizedUser
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }
}
