import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

import { upload } from '../middleware/upload';

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const { department } = req.query;
    const where: any = {};
    if (department) where.department = department;

    const events = await prisma.appEvent.findMany({
      where,
      orderBy: { date: 'asc' }
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/events
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, department, date, time, type, registrationUrl } = req.body;
    let imageUrl = req.body.imageUrl;

    if (!title || !date || !department) {
      return res.status(400).json({ error: 'title, date y department son requeridos' });
    }

    // Si se subió una imagen vía multer
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const event = await prisma.appEvent.create({
      data: { 
        title, 
        description: description || '', 
        department, 
        date, 
        time: time || '', 
        type: type || 'conferencia', 
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80', 
        registrationUrl 
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.appEvent.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
