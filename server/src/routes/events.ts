import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

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
router.post('/', async (req, res) => {
  try {
    const { title, description, department, date, time, type, imageUrl, registrationUrl } = req.body;

    if (!title || !date || !department) {
      return res.status(400).json({ error: 'title, date y department son requeridos' });
    }

    const event = await prisma.appEvent.create({
      data: { title, description: description || '', department, date, time: time || '', type: type || 'conferencia', imageUrl, registrationUrl }
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
