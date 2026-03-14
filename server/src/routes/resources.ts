import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

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
router.post('/', async (req, res) => {
  try {
    const { department, type, title, description, url, imageUrl, fileUrl, fileName } = req.body;

    if (!title || !department || !url) {
      return res.status(400).json({ error: 'title, department y url son requeridos' });
    }

    const resource = await prisma.resource.create({
      data: { department, type: type || 'articulo', title, description: description || '', url, imageUrl, fileUrl, fileName }
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
