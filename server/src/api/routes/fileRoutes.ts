import { Express } from 'express';
import { FileController } from '../controllers/FileController';
import { requireAuth } from '../../middleware/requireAuth';
import multer from 'multer';

export function registerFileRoutes(app: Express) {
    const fileCtrl = new FileController();

    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });

    // File routes (protected)
    app.post('/files', requireAuth, upload.single('file'), fileCtrl.uploadFile);
    app.get('/files', requireAuth, fileCtrl.getFiles);
    app.get('/files/:id', requireAuth, fileCtrl.getFile);
    app.delete('/files/:id', requireAuth, fileCtrl.deleteFile);
}
