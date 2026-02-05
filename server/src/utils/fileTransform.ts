import { FileDocument } from '../models/FirestoreTypes';

export interface FileResponse {
  id: string;
  org_id: string;
  name: string;
  mime_type: string;
  size: number;
  kind: string;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export function transformFileForResponse(file: FileDocument): FileResponse {
  return {
    id: file.id,
    org_id: file.org_id,
    name: file.name,
    mime_type: file.mime_type,
    size: file.size,
    kind: file.kind,
    url: `https://drive.google.com/file/d/${file.gdrive_id}`,
    uploaded_by: file.uploaded_by,
    uploaded_at: file.uploaded_at instanceof Date ? file.uploaded_at.toISOString() : String(file.uploaded_at),
    created_at: file.created_at instanceof Date ? file.created_at.toISOString() : String(file.created_at),
    updated_at: file.updated_at instanceof Date ? file.updated_at.toISOString() : String(file.updated_at)
  };
}

export function transformFilesForResponse(files: FileDocument[]): FileResponse[] {
  return files.map(transformFileForResponse);
}
