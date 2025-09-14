import { inject, injectable } from 'tsyringe';
import { IFileRepository } from '../../repositories/IFileRepository';
import { IGoogleDriveService } from '../../services/IGoogleDriveService';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { FileDocument, FileKind } from '../../../models/FirestoreTypes';
import { Timestamp } from 'firebase-admin/firestore';

export interface CreateFileRequest {
  name: string;
  mimeType: string;
  size: number;
  fileBuffer: Buffer;
  bookingId?: string;
  kind: FileKind;
}

@injectable()
export class CreateFile {
  constructor(
    @inject('IFileRepository') private fileRepository: IFileRepository,
    @inject('IGoogleDriveService') private googleDriveService: IGoogleDriveService,
    @inject('IBookingRepository') private bookingRepository: IBookingRepository
  ) {}

  async execute(request: CreateFileRequest, orgId: string, uploadedBy: string): Promise<FileDocument> {
    try {
      // Upload file to Google Drive
      const driveFileId = await this.googleDriveService.uploadFile(
        request.fileBuffer,
        request.name,
        request.mimeType
      );

      // Create file document
      const fileDocument = await this.fileRepository.create({
        org_id: orgId,
        name: request.name,
        mime_type: request.mimeType,
        size: request.size,
        kind: request.kind,
        gdrive_id: driveFileId, // Store Google Drive file ID
        uploaded_by: uploadedBy,
        uploaded_at: Timestamp.now()
      });

      // If this is a ticket file associated with a booking, update the booking
      if (request.bookingId && request.kind === FileKind.TICKET) {
        await this.bookingRepository.updateFields(request.bookingId, {
          ticket_id: fileDocument.id
        }, orgId);
      }

      return fileDocument;
    } catch (error: any) {
      // If Google Drive upload succeeded but DB creation failed, clean up
      throw new Error(`File creation failed: ${error.message}`);
    }
  }
}
