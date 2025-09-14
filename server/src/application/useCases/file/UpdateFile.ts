import { inject, injectable } from 'tsyringe';
import { IFileRepository } from '../../repositories/IFileRepository';
import { FileDocument } from '../../../models/FirestoreTypes';

export interface UpdateFileRequest {
  name?: string;
  bookingId?: string;
  customerId?: string;
  vendorId?: string;
}

@injectable()
export class UpdateFile {
  constructor(
    @inject('IFileRepository') private fileRepository: IFileRepository
  ) {}

  async execute(id: string, updates: UpdateFileRequest, orgId: string): Promise<FileDocument> {
    // Check if file exists first
    const existingFile = await this.fileRepository.findById(id, orgId);
    if (!existingFile) {
      throw new Error('File not found');
    }

    return this.fileRepository.update(id, updates, orgId);
  }
}
