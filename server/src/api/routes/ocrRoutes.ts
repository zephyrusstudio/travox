import { Express } from 'express';
import multer from 'multer';
import { OCRController } from '../controllers/OCRController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed.'));
    }
  }
});

export function registerOCRRoutes(app: Express) {
  const ocrCtrl = new OCRController();

  app.post('/scan', 
    requireAuth(), 
    (req, res, next) => {
      if (req.query.fileId) {
        return next();
      }
      upload.single('file')(req, res, next);
    },
    auditLogger('ocr'), 
    ocrCtrl.extract
  );
  
  app.get('/scan', 
    requireAuth(), 
    ocrCtrl.health
  );

  app.get('/schema',
    requireAuth(),
    ocrCtrl.getSchemaInfo
  );
}