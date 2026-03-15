import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    const where: any = {};
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, email: true, name: true, role: true,
        matricula: true, carrera: true, semestre: true,
        edad: true, genero: true, department: true,
        createdAt: true,
        specialist: { select: { id: true, department: true, active: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, name: true, role: true,
        matricula: true, carrera: true, semestre: true,
        edad: true, genero: true, department: true
      }
    });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Ensure we don't delete the main admin (prevent lock-out)
    if (user.email === 'admin@instituto.edu.mx') {
      return res.status(403).json({ error: 'No se puede eliminar el administrador principal' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
