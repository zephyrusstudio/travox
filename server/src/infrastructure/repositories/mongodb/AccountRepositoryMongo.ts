import { injectable } from 'tsyringe';
import { IAccountRepository } from '../../../application/repositories/IAccountRepository';
import { Account, CreateAccountDTO, UpdateAccountDTO } from '../../../domain/Account';
import { AccountModel } from '../../../models/mongoose/AccountModel';

@injectable()
export class AccountRepositoryMongo implements IAccountRepository {

  private toDomain(doc: any): Account {
    return {
      id: doc._id.toString(),
      orgId: doc.orgId,
      bankName: doc.bankName,
      ifscCode: doc.ifscCode,
      branchName: doc.branchName,
      accountNo: doc.accountNo,
      upiId: doc.upiId,
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      archivedAt: doc.archivedAt,
    };
  }

  async findById(id: string): Promise<Account | null> {
    const doc = await AccountModel.findById(id);
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByOrgId(orgId: string, limit?: number, offset?: number): Promise<Account[]> {
    let query = AccountModel.find({ orgId, archivedAt: null });

    if (offset) {
      query = query.skip(offset);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const docs = await query.exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async countByOrgId(orgId: string): Promise<number> {
    return await AccountModel.countDocuments({ orgId, archivedAt: null });
  }

  async create(accountData: CreateAccountDTO, orgId: string, userId: string): Promise<Account> {
    const doc = new AccountModel({
      orgId,
      bankName: accountData.bankName,
      ifscCode: accountData.ifscCode,
      branchName: accountData.branchName,
      accountNo: accountData.accountNo,
      upiId: accountData.upiId,
      isActive: accountData.isActive ?? true,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await doc.save();
    return this.toDomain(saved);
  }

  async update(id: string, accountData: UpdateAccountDTO, userId: string): Promise<Account | null> {
    const updateData: any = {
      updatedBy: userId,
    };

    if (accountData.bankName !== undefined) updateData.bankName = accountData.bankName;
    if (accountData.ifscCode !== undefined) updateData.ifscCode = accountData.ifscCode;
    if (accountData.branchName !== undefined) updateData.branchName = accountData.branchName;
    if (accountData.accountNo !== undefined) updateData.accountNo = accountData.accountNo;
    if (accountData.upiId !== undefined) updateData.upiId = accountData.upiId;
    if (accountData.isActive !== undefined) updateData.isActive = accountData.isActive;

    const doc = await AccountModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!doc) return null;
    return this.toDomain(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await AccountModel.findByIdAndDelete(id);
    return result !== null;
  }

  async archive(id: string, userId: string): Promise<Account | null> {
    const doc = await AccountModel.findByIdAndUpdate(
      id,
      { archivedAt: new Date(), updatedBy: userId },
      { new: true }
    );

    if (!doc) return null;
    return this.toDomain(doc);
  }
}
