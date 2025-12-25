
import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../repositories/IAccountRepository';
import { Account, UpdateAccountDTO } from '../../../domain/Account';

@injectable()
export class UpdateAccount {
  constructor(
    @inject('IAccountRepository') private accountRepo: IAccountRepository
  ) {}

  async execute(accountId: string, data: UpdateAccountDTO, userId: string): Promise<Account | null> {
    // Validate: If updating account details, must maintain either UPI ID or (Account No + IFSC)
    // Get existing account to merge with updates
    const existingAccount = await this.accountRepo.findById(accountId);
    if (!existingAccount) {
      return null;
    }

    // Merge existing with updates to validate final state
    const finalData = {
      upiId: data.upiId !== undefined ? data.upiId : existingAccount.upiId,
      accountNo: data.accountNo !== undefined ? data.accountNo : existingAccount.accountNo,
      ifscCode: data.ifscCode !== undefined ? data.ifscCode : existingAccount.ifscCode,
    };

    const hasUpiId = Boolean(finalData.upiId?.trim());
    const hasBankDetails = Boolean(finalData.accountNo?.trim() && finalData.ifscCode?.trim());

    if (!hasUpiId && !hasBankDetails) {
      throw new Error(
        'Either UPI ID or both Account Number and IFSC Code must be provided'
      );
    }

    return this.accountRepo.update(accountId, data, userId);
  }
}
