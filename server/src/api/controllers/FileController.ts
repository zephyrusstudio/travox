import { Request, Response } from "express";
import { container } from "tsyringe";
import { UploadFile } from "../../application/useCases/file/UploadFile";
import { GetFiles } from "../../application/useCases/file/GetFiles";
import { GetFile } from "../../application/useCases/file/GetFile";
import { DeleteFile } from "../../application/useCases/file/DeleteFile";

export class FileController {
    async uploadFile(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { orgId } = req.user;
        if (!orgId) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const { kind, booking_id, customer_id, vendor_id } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({ message: "File is required" });
            return;
        }

        const uploadFile = container.resolve(UploadFile);
        const result = await uploadFile.execute({
            org_id: orgId,
            uploaded_by: req.user.id,
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileBuffer: file.buffer,
            kind,
            booking_id,
            customer_id,
            vendor_id,
        });

        res.status(201).json(result);
    }

    async getFiles(req: Request, res: Response): Promise<void> {
        if (!req.user?.orgId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { orgId } = req.user;
        const getFiles = container.resolve(GetFiles);
        const files = await getFiles.execute({ org_id: orgId });
        res.status(200).json(files);
    }

    async getFile(req: Request, res: Response): Promise<void> {
        if (!req.user?.orgId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const { orgId } = req.user;

        const getFile = container.resolve(GetFile);
        const { file, buffer } = await getFile.execute({ id, org_id: orgId });

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.send(buffer);
    }

    async deleteFile(req: Request, res: Response): Promise<void> {
        if (!req.user?.orgId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const { orgId } = req.user;

        const deleteFile = container.resolve(DeleteFile);
        await deleteFile.execute({ id, org_id: orgId });

        res.status(204).send();
    }
}
