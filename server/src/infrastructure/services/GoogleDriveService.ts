import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { google } from 'googleapis';
import { injectable } from 'tsyringe';
import { IGoogleDriveService } from '../../application/services/IGoogleDriveService';

const LOCAL_FILE_PREFIX = 'local:';

interface LocalFileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdTime: string;
}

@injectable()
export class GoogleDriveService implements IGoogleDriveService {
  private drive;
  private readonly useLocalOnly: boolean;
  private readonly allowLocalFallback: boolean;
  private readonly localStoragePath: string;

  constructor() {
    const provider = (process.env.FILE_STORAGE_PROVIDER || '').trim().toLowerCase();
    const hasDriveCredentials = Boolean(
      process.env.GDRIVE_CLIENT_ID &&
      process.env.GDRIVE_CLIENT_SECRET &&
      process.env.GDRIVE_REFRESH_TOKEN
    );

    this.useLocalOnly = provider === 'local' || !hasDriveCredentials;
    const explicitFallback = process.env.FILE_STORAGE_ALLOW_LOCAL_FALLBACK;
    this.allowLocalFallback = explicitFallback
      ? explicitFallback.toLowerCase() === 'true'
      : process.env.NODE_ENV !== 'production';
    this.localStoragePath = process.env.LOCAL_FILE_STORAGE_PATH || path.join(process.cwd(), 'tmp', 'file-storage');

    if (this.useLocalOnly) {
      this.drive = null;
      return;
    }

    const auth = new google.auth.OAuth2(
      process.env.GDRIVE_CLIENT_ID,
      process.env.GDRIVE_CLIENT_SECRET
    );

    auth.setCredentials({
      refresh_token: process.env.GDRIVE_REFRESH_TOKEN
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, folderId?: string): Promise<string> {
    if (this.useLocalOnly) {
      return this.uploadFileLocally(fileBuffer, fileName, mimeType);
    }

    try {
      const fileStream = new Readable();
      fileStream.push(fileBuffer);
      fileStream.push(null);

      const sharedFolderId = folderId || process.env.SHARED_FOLDER_ID;
      const drive = this.getDriveOrThrow();

      const response = await drive.files.create({
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
      if (this.shouldFallbackToLocal(error)) {
        return this.uploadFileLocally(fileBuffer, fileName, mimeType);
      }

      throw new Error(`Google Drive upload failed: ${this.getErrorMessage(error)}`);
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    if (this.isLocalFileId(fileId)) {
      try {
        return await readFile(this.localDataPath(this.getLocalKey(fileId)));
      } catch (error: any) {
        if (error?.code === 'ENOENT') {
          throw new Error('Local file not found');
        }
        throw new Error(`Local file download failed: ${this.getErrorMessage(error)}`);
      }
    }

    try {
      const drive = this.getDriveOrThrow();
      const response = await drive.files.get({
        fileId,
        alt: 'media',
      }, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error: any) {
      throw new Error(`Google Drive download failed: ${this.getErrorMessage(error)}`);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (this.isLocalFileId(fileId)) {
      const localKey = this.getLocalKey(fileId);
      await Promise.all([
        rm(this.localDataPath(localKey), { force: true }),
        rm(this.localMetaPath(localKey), { force: true }),
      ]);
      return;
    }

    try {
      const drive = this.getDriveOrThrow();
      await drive.files.delete({
        fileId,
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Google Drive delete failed: File not found (404)');
      }
      throw new Error(`Google Drive delete failed: ${this.getErrorMessage(error)}`);
    }
  }

  async getFileMetadata(fileId: string): Promise<{
    name: string;
    size: number;
    mimeType: string;
    createdTime: string;
  }> {
    if (this.isLocalFileId(fileId)) {
      const metadata = await this.readLocalMetadata(fileId);
      return metadata;
    }

    try {
      const drive = this.getDriveOrThrow();
      const response = await drive.files.get({
        fileId,
        fields: 'name,size,mimeType,createdTime',
      });

      const { name, size, mimeType, createdTime } = response.data;

      return {
        name: name || 'Unknown',
        size: parseInt(size || '0', 10),
        mimeType: mimeType || 'application/octet-stream',
        createdTime: createdTime || new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Google Drive metadata fetch failed: ${this.getErrorMessage(error)}`);
    }
  }

  private getDriveOrThrow() {
    if (!this.drive) {
      throw new Error('Google Drive service is not configured');
    }

    return this.drive;
  }

  private shouldFallbackToLocal(error: any): boolean {
    if (!this.allowLocalFallback) {
      return false;
    }

    const statusCode = Number(error?.response?.status || error?.code || 0);
    if (statusCode === 401 || statusCode === 403) {
      return true;
    }

    const message = this.getErrorMessage(error).toLowerCase();
    const fallbackTokens = [
      'invalid_grant',
      'invalid_client',
      'unauthorized_client',
      'no refresh token',
      'token has been expired',
      'token has been revoked',
      'oauth',
    ];

    return fallbackTokens.some((token) => message.includes(token));
  }

  private getErrorMessage(error: any): string {
    return (
      error?.response?.data?.error_description ||
      error?.response?.data?.error?.message ||
      error?.message ||
      'Unknown error'
    );
  }

  private async uploadFileLocally(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    await mkdir(this.localStoragePath, { recursive: true });
    const localKey = randomUUID();

    const metadata: LocalFileMetadata = {
      id: `${LOCAL_FILE_PREFIX}${localKey}`,
      name: fileName,
      size: fileBuffer.byteLength,
      mimeType,
      createdTime: new Date().toISOString(),
    };

    await Promise.all([
      writeFile(this.localDataPath(localKey), fileBuffer),
      writeFile(this.localMetaPath(localKey), JSON.stringify(metadata, null, 2), 'utf-8'),
    ]);

    return metadata.id;
  }

  private async readLocalMetadata(fileId: string): Promise<LocalFileMetadata> {
    const localKey = this.getLocalKey(fileId);
    const metadataPath = this.localMetaPath(localKey);
    const dataPath = this.localDataPath(localKey);

    try {
      const raw = await readFile(metadataPath, 'utf-8');
      const parsed = JSON.parse(raw) as LocalFileMetadata;

      if (!parsed.size || Number.isNaN(parsed.size)) {
        const fileStats = await stat(dataPath);
        parsed.size = fileStats.size;
      }

      return parsed;
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        throw new Error('Local file not found');
      }
      throw new Error(`Local file metadata fetch failed: ${this.getErrorMessage(error)}`);
    }
  }

  private isLocalFileId(fileId: string): boolean {
    return fileId.startsWith(LOCAL_FILE_PREFIX);
  }

  private getLocalKey(fileId: string): string {
    return fileId.replace(LOCAL_FILE_PREFIX, '').trim();
  }

  private localDataPath(localKey: string): string {
    return path.join(this.localStoragePath, `${localKey}.bin`);
  }

  private localMetaPath(localKey: string): string {
    return path.join(this.localStoragePath, `${localKey}.json`);
  }
}
