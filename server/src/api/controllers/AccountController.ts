
import { Request, Response } from 'express';
import { container } from '../../config/container';
import { GetAccount } from '../../application/useCases/account/GetAccount';
import { GetAccounts } from '../../application/useCases/account/GetAccounts';
import { CreateAccount } from '../../application/useCases/account/CreateAccount';
import { UpdateAccount } from '../../application/useCases/account/UpdateAccount';
import { DeleteAccount } from '../../application/useCases/account/DeleteAccount';
import { ArchiveAccount } from '../../application/useCases/account/ArchiveAccount';

export class AccountController {
  async getAccounts(req: Request, res: Response) {
    try {
      const getAccounts = container.resolve(GetAccounts);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const accounts = await getAccounts.execute(req.user?.orgId!, limit, offset);
      const count = await getAccounts.count(req.user?.orgId!);
      
      res.json({
        status: 'success',
        data: accounts,
        count
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getAccount(req: Request, res: Response) {
    try {
      const getAccount = container.resolve(GetAccount);
      const account = await getAccount.execute(req.params.id);
      
      if (!account) {
        return res.status(404).json({ 
          status: 'error',
          data: { message: 'Account not found' }
        });
      }

      // Verify the account belongs to the user's organization
      if (account.orgId !== req.user?.orgId) {
        return res.status(403).json({
          status: 'error',
          data: { message: 'Access denied' }
        });
      }
      
      res.json({
        status: 'success',
        data: account
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async createAccount(req: Request, res: Response) {
    try {
      const createAccount = container.resolve(CreateAccount);
      const account = await createAccount.execute(req.body, req.user?.orgId!, req.user?.id!);
      
      res.status(201).json({
        status: 'success',
        data: account
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async updateAccount(req: Request, res: Response) {
    try {
      const updateAccount = container.resolve(UpdateAccount);
      const account = await updateAccount.execute(req.params.id, req.body, req.user?.id!);
      
      if (!account) {
        return res.status(404).json({ 
          status: 'error',
          data: { message: 'Account not found' }
        });
      }

      // Verify the account belongs to the user's organization
      if (account.orgId !== req.user?.orgId) {
        return res.status(403).json({
          status: 'error',
          data: { message: 'Access denied' }
        });
      }
      
      res.json({
        status: 'success',
        data: account
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      // First check if account exists and belongs to the organization
      const getAccount = container.resolve(GetAccount);
      const account = await getAccount.execute(req.params.id);
      
      if (!account) {
        return res.status(404).json({ 
          status: 'error',
          data: { message: 'Account not found' }
        });
      }

      if (account.orgId !== req.user?.orgId) {
        return res.status(403).json({
          status: 'error',
          data: { message: 'Access denied' }
        });
      }

      const deleteAccount = container.resolve(DeleteAccount);
      const success = await deleteAccount.execute(req.params.id);
      
      if (!success) {
        return res.status(500).json({ 
          status: 'error',
          data: { message: 'Failed to delete account' }
        });
      }
      
      res.json({
        status: 'success',
        data: { message: 'Account deleted successfully' }
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async archiveAccount(req: Request, res: Response) {
    try {
      // First check if account exists and belongs to the organization
      const getAccount = container.resolve(GetAccount);
      const existingAccount = await getAccount.execute(req.params.id);
      
      if (!existingAccount) {
        return res.status(404).json({ 
          status: 'error',
          data: { message: 'Account not found' }
        });
      }

      if (existingAccount.orgId !== req.user?.orgId) {
        return res.status(403).json({
          status: 'error',
          data: { message: 'Access denied' }
        });
      }

      const archiveAccount = container.resolve(ArchiveAccount);
      const account = await archiveAccount.execute(req.params.id, req.user?.id!);
      
      if (!account) {
        return res.status(500).json({ 
          status: 'error',
          data: { message: 'Failed to archive account' }
        });
      }
      
      res.json({
        status: 'success',
        data: account
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error',
        data: { message: error.message }
      });
    }
  }
}
