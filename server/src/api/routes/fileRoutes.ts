import { Express } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/FileController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, but could be restricted based on requirements
    cb(null, true);
  }
});

export function registerFileRoutes(app: Express) {
  const fileCtrl = new FileController();

  // File routes (protected)
  app.post('/files', requireAuth(), upload.single('file'), auditLogger('files'), fileCtrl.create);
  app.get('/files', requireAuth(), fileCtrl.getAll);
  app.get('/files/:id', requireAuth(), auditLogger('files'), fileCtrl.getById);
  app.get('/files/:id/download', requireAuth(), auditLogger('files'), fileCtrl.download);
  app.put('/files/:id', requireAuth(), auditLogger('files'), fileCtrl.update);
  app.delete('/files/:id', requireAuth(), auditLogger('files'), fileCtrl.delete);
}
