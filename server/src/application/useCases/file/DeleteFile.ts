import { inject, injectable } from "tsyringe";
import { IFileRepository } from "../../repositories/IFileRepository";
import { IGoogleDriveService } from "../../services/IGoogleDriveService";
import { AppError } from "../../../utils/errors";

interface DeleteFileRequest {
    id: string;
    org_id: string;
}

@injectable()
export class DeleteFile {
    constructor(
        @inject("FileRepository") private fileRepository: IFileRepository,
        @inject("GoogleDriveService") private googleDriveService: IGoogleDriveService
    ) {}

    async execute(data: DeleteFileRequest): Promise<void> {
        const file = await this.fileRepository.findById(data.id, data.org_id);

        if (!file) {
            throw new AppError("File not found");
        }

        await this.googleDriveService.deleteFile(file.id);
        await this.fileRepository.delete(file.id, file.org_id);
    }
}
