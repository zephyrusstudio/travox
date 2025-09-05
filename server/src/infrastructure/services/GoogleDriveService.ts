import { injectable } from 'tsyringe';
import { google } from 'googleapis';
import { IGoogleDriveService } from '../../application/services/IGoogleDriveService';
import { Readable } from 'stream';

@injectable()
export class GoogleDriveService implements IGoogleDriveService {
  private drive;

  constructor() {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, folderId?: string): Promise<string> {
    try {
      const fileStream = new Readable();
      fileStream.push(fileBuffer);
      fileStream.push(null);

      const sharedFolderId = folderId || process.env.SHARED_FOLDER_ID;

      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: sharedFolderId ? [sharedFolderId] : undefined,
        },
        media: {
          mimeType,
          body: fileStream,
        },
      });

      if (!response.data.id) {
        throw new Error('Failed to upload file to Google Drive');
      }

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Google Drive upload failed: ${error.message}`);
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      }, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error: any) {
      throw new Error(`Google Drive download failed: ${error.message}`);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
      });
    } catch (error: any) {
      // Provide more specific error information
      if (error.response?.status === 404) {
        throw new Error(`Google Drive delete failed: File not found (404)`);
      }
      throw new Error(`Google Drive delete failed: ${error.message}`);
    }
  }

  async getFileMetadata(fileId: string): Promise<{
    name: string;
    size: number;
    mimeType: string;
    createdTime: string;
  }> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'name,size,mimeType,createdTime',
      });

      const { name, size, mimeType, createdTime } = response.data;

      return {
        name: name || 'Unknown',
        size: parseInt(size || '0'),
        mimeType: mimeType || 'application/octet-stream',
        createdTime: createdTime || new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Google Drive metadata fetch failed: ${error.message}`);
    }
  }
}
