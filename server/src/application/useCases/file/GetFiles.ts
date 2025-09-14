import { inject, injectable } from 'tsyringe';
import { IFileRepository } from '../../repositories/IFileRepository';
import { FileDocument, FileKind } from '../../../models/FirestoreTypes';

export interface GetFilesFilters {
  kind?: FileKind;
  uploadedBy?: string;
  limit?: number;
  offset?: number;
}

@injectable()
export class GetFiles {
  constructor(
    @inject('IFileRepository') private fileRepository: IFileRepository
  ) {}

  async execute(filters: GetFilesFilters, orgId: string): Promise<FileDocument[]> {
    return this.fileRepository.findAll(orgId, {
      kind: filters.kind,
      uploadedBy: filters.uploadedBy,
      limit: filters.limit,
      offset: filters.offset
    });
  }

  async getById(id: string, orgId: string): Promise<FileDocument | null> {
    return this.fileRepository.findById(id, orgId);
  }
}
