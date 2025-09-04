import { google } from 'googleapis';
import { IGoogleDriveService } from '../../application/services/IGoogleDriveService';
import { Readable } from 'stream';

export class GoogleDriveService implements IGoogleDriveService {
    private drive;

    constructor(keyFilePath: string) {
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        this.drive = google.drive({ version: 'v3', auth });
    }

    async uploadFile(fileName: string, mimeType: string, fileBuffer: Buffer): Promise<{ id: string, webViewLink: string }> {
        const sharedFolderId = process.env.SHARED_FOLDER_ID;
        if (!sharedFolderId) {
            throw new Error('SHARED_FOLDER_ID is not set in the environment variables');
        }

        const media = {
            mimeType: mimeType,
            body: Readable.from(fileBuffer),
        };

        const file = await this.drive.files.create({
            media: media,
            requestBody: {
                name: fileName,
                parents: [sharedFolderId],
            },
            fields: 'id, webViewLink',
        });

        if (!file.data.id) {
            throw new Error('File ID not returned from Google Drive');
        }

        return { id: file.data.id, webViewLink: file.data.webViewLink! };
    }

    async deleteFile(fileId: string): Promise<void> {
        await this.drive.files.delete({ fileId: fileId });
    }

    async getFileMetadata(fileId: string): Promise<{ id: string, name: string, mimeType: string, size: string, webViewLink: string, createdTime: string }> {
        const file = await this.drive.files.get({
            fileId: fileId,
            fields: 'id, name, mimeType, size, webViewLink, createdTime',
        });
        return file.data as { id: string, name: string, mimeType: string, size: string, webViewLink: string, createdTime: string };
    }

    async downloadFile(fileId: string): Promise<Buffer> {
        const response = await this.drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            (response.data as Readable)
                .on('data', (chunk) => chunks.push(Buffer.from(chunk)))
                .on('end', () => resolve(Buffer.concat(chunks)))
                .on('error', (err) => reject(err));
        });
    }
}
