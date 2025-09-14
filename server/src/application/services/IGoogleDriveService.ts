export interface IGoogleDriveService {
  uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, folderId?: string): Promise<string>;
  downloadFile(fileId: string): Promise<Buffer>;
  deleteFile(fileId: string): Promise<void>;
  getFileMetadata(fileId: string): Promise<{
    name: string;
    size: number;
    mimeType: string;
    createdTime: string;
  }>;
}
