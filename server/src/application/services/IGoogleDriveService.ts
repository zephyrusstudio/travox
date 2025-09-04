export interface IGoogleDriveService {
    uploadFile(fileName: string, mimeType: string, fileBuffer: Buffer): Promise<{ id: string, webViewLink: string }>;
    deleteFile(fileId: string): Promise<void>;
    getFileMetadata(fileId: string): Promise<{ id: string, name: string, mimeType: string, size: string, webViewLink: string, createdTime: string }>;
    downloadFile(fileId: string): Promise<Buffer>;
}
