import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

import { upload } from '../middleware/upload';

// GET /api/resources
router.get('/', async (req, res) => {
  try {
    const { department } = req.query;
    const where: any = {};
    if (department) where.department = department;

    const resources = await prisma.resource.findMany({ where });
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/resources
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { department, type, title, description, url, imageUrl } = req.body;
    let fileUrl = req.body.fileUrl;
    let fileName = req.body.fileName;

    if (!title || !department) {
      return res.status(400).json({ error: 'title y department son requeridos' });
    }

    // Si se subió un archivo vía multer
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    const resource = await prisma.resource.create({
      data: { 
        department, 
        type: type || 'articulo', 
        title, 
        description: description || '', 
        url: url || '#', 
        imageUrl, 
        fileUrl, 
        fileName 
      }
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/resources/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.resource.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
