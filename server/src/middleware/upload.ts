import multer from 'multer';
import path from 'path';
import fs from 'fs';

// La ruta de subidas se puede configurar via .env para el VPS
// Por defecto usaremos una carpeta 'uploads' en la raíz del backend
const uploadsPath = process.env.UPLOADS_PATH || path.join(process.cwd(), 'uploads');

// Asegurar que la carpeta existe
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    // Nombre único: timestamp + nombre original sanitizado
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no soportated (Solo JPG, PNG, WEBP y PDF)'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});
