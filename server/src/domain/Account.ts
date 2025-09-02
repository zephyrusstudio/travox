export interface Account {
  id: string;
  orgId: string;
  bankName: string;
  ifscCode?: string;
  branchName?: string;
  accountNo?: string;
  upiId?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface CreateAccountDTO {
  bankName: string;
  ifscCode?: string;
  branchName?: string;
  accountNo?: string;
  upiId?: string;
  isActive?: boolean;
}

export interface UpdateAccountDTO {
  bankName?: string;
  ifscCode?: string;
  branchName?: string;
  accountNo?: string;
  upiId?: string;
  isActive?: boolean;
}
