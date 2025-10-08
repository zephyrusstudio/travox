import { Express } from 'express';
import multer from 'multer';
import { OCRController } from '../controllers/OCRController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

// Configure multer for OCR file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image and PDF files for OCR
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

  // OCR routes (protected)
  app.post('/ocr/extract', 
    requireAuth(), 
    upload.single('file'), 
    auditLogger('ocr'), 
    ocrCtrl.extract
  );
  
  app.get('/ocr/health', 
    requireAuth(), 
    ocrCtrl.health
  );

  app.get('/ocr/schema-info',
    requireAuth(),
    ocrCtrl.getSchemaInfo
  );
}