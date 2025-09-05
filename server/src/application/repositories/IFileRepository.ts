import { FileDocument } from '../../models/FirestoreTypes';

export interface IFileRepository {
  create(file: Omit<FileDocument, 'id' | 'created_at' | 'updated_at'>): Promise<FileDocument>;
  findById(id: string, orgId: string): Promise<FileDocument | null>;
  findAll(orgId: string, filters?: {
    kind?: string;
    uploadedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<FileDocument[]>;
  update(id: string, updates: Partial<FileDocument>, orgId: string): Promise<FileDocument>;
  delete(id: string, orgId: string): Promise<void>;
}
