import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateFile } from '../../application/useCases/file/CreateFile';
import { GetFiles } from '../../application/useCases/file/GetFiles';
import { UpdateFile } from '../../application/useCases/file/UpdateFile';
import { DeleteFile } from '../../application/useCases/file/DeleteFile';
import { DownloadFile } from '../../application/useCases/file/DownloadFile';
import { FileKind } from '../../models/FirestoreTypes';
import { transformFileForResponse, transformFilesForResponse } from '../../utils/fileTransform';

export class FileController {
  async create(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'No file uploaded' }
        });
      }

      const { bookingId, kind } = req.body;

      // Validate required fields
      if (!kind || !Object.values(FileKind).includes(kind)) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'Valid file kind is required' }
        });
      }

      const useCase = container.resolve(CreateFile);
      const file = await useCase.execute({
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        fileBuffer: req.file.buffer,
        bookingId,
        kind
      }, req.user?.orgId!, req.user?.id!);

      res.status(201).json({
        status: 'success',
        data: transformFileForResponse(file)
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetFiles);
      
      const filters = {
        kind: req.query.kind as FileKind,
        uploadedBy: req.query.uploadedBy as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const files = await useCase.execute(filters, req.user?.orgId!);
      res.json({
        status: 'success',
        data: transformFilesForResponse(files)
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetFiles);
      const file = await useCase.getById(req.params.id, req.user?.orgId!);
      
      if (!file) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'File not found' }
        });
      }

      res.json({
        status: 'success',
        data: transformFileForResponse(file)
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const useCase = container.resolve(UpdateFile);
      const file = await useCase.execute(req.params.id, req.body, req.user?.orgId!);
      
      res.json({
        status: 'success',
        data: transformFileForResponse(file)
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const useCase = container.resolve(DeleteFile);
      
      await useCase.execute(req.params.id, req.user?.orgId!);
      
      res.json({
        status: 'success',
        data: { message: 'File deleted successfully' }
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async download(req: Request, res: Response) {
    try {
      const useCase = container.resolve(DownloadFile);
      const result = await useCase.execute(req.params.id, req.user?.orgId!);
      
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.send(result.fileBuffer);
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }
}
