import { inject, injectable } from 'tsyringe';
import { IFileRepository } from '../../repositories/IFileRepository';
import { IGoogleDriveService } from '../../services/IGoogleDriveService';

@injectable()
export class DownloadFile {
  constructor(
    @inject('IFileRepository') private fileRepository: IFileRepository,
    @inject('IGoogleDriveService') private googleDriveService: IGoogleDriveService
  ) {}

  async execute(id: string, orgId: string): Promise<{
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
  }> {
    const file = await this.fileRepository.findById(id, orgId);
    if (!file) {
      throw new Error('File not found');
    }

    const fileBuffer = await this.googleDriveService.downloadFile(file.gdrive_id);

    return {
      fileBuffer,
      fileName: file.name,
      mimeType: file.mime_type
    };
  }
}
