import { inject, injectable } from "tsyringe";
import { IFileRepository } from "../../repositories/IFileRepository";
import { IGoogleDriveService } from "../../services/IGoogleDriveService";
import { File } from "../../../domain/File";
import { AppError } from "../../../utils/errors";

interface GetFileRequest {
    id: string;
    org_id: string;
}

@injectable()
export class GetFile {
    constructor(
        @inject("FileRepository") private fileRepository: IFileRepository,
        @inject("GoogleDriveService") private googleDriveService: IGoogleDriveService
    ) {}

    async execute(data: GetFileRequest): Promise<{file: File, buffer: Buffer}> {
        const file = await this.fileRepository.findById(data.id, data.org_id);

        if (!file) {
            throw new AppError("File not found");
        }

        const buffer = await this.googleDriveService.downloadFile(file.id);

        return { file, buffer };
    }
}
