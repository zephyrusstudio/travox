import { inject, injectable } from "tsyringe";
import { IFileRepository } from "../../repositories/IFileRepository";
import { IGoogleDriveService } from "../../services/IGoogleDriveService";
import { File } from "../../../domain/File";
import { FileKind } from "../../../models/FirestoreTypes";

interface UploadFileRequest {
    org_id: string;
    uploaded_by: string;
    fileName: string;
    mimeType: string;
    fileBuffer: Buffer;
    kind: FileKind;
    booking_id?: string;
    customer_id?: string;
    vendor_id?: string;
}

@injectable()
export class UploadFile {
    constructor(
        @inject("FileRepository") private fileRepository: IFileRepository,
        @inject("GoogleDriveService") private googleDriveService: IGoogleDriveService
    ) {}

    async execute(data: UploadFileRequest): Promise<File> {
        const { id: fileId, webViewLink } = await this.googleDriveService.uploadFile(
            data.fileName,
            data.mimeType,
            data.fileBuffer
        );

        const file = new File(
            fileId,
            data.org_id,
            data.fileName,
            data.mimeType,
            data.fileBuffer.length,
            data.kind,
            webViewLink,
            data.uploaded_by,
            new Date(),
            false,
            data.booking_id,
            data.customer_id,
            data.vendor_id
        );

        await this.fileRepository.save(file);

        return file;
    }
}
