import { inject, injectable } from 'tsyringe';
import { IFileRepository } from '../../repositories/IFileRepository';
import { IGoogleDriveService } from '../../services/IGoogleDriveService';

@injectable()
export class DeleteFile {
  constructor(
    @inject('IFileRepository') private fileRepository: IFileRepository,
    @inject('IGoogleDriveService') private googleDriveService: IGoogleDriveService
  ) {}

  async execute(id: string, orgId: string): Promise<void> {
    const file = await this.fileRepository.findById(id, orgId);
    if (!file) {
      throw new Error('File not found');
    }

    // Delete from Google Drive first
    try {
      await this.googleDriveService.deleteFile(file.gdrive_id);
    } catch (error: any) {
      // Only continue if the file doesn't exist in Google Drive (404 error)
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.warn(`File ${file.gdrive_id} not found in Google Drive, continuing with database deletion`);
      } else {
        console.error(`Failed to delete file from Google Drive: ${error.message}`);
        throw new Error(`Failed to delete file from Google Drive: ${error.message}`);
      }
    }
    
    // Delete from database
    await this.fileRepository.delete(id, orgId);
  }
}
