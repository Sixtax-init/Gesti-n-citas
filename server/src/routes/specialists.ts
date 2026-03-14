import { Router } from 'express';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';

const router = Router();

// GET /api/specialists
router.get('/', async (req, res) => {
  try {
    const { department } = req.query;
    
    const where: any = {};
    if (department) {
      where.department = department;
    }
    
    const specialists = await prisma.specialist.findMany({
      where,
      include: {
        schedules: true
      }
    });
    
    res.json(specialists);
  } catch (error) {
    console.error('Error fetching specialists:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/specialists
router.post('/', async (req, res) => {
  try {
    const { name, department, email, password } = req.body;
    
    if (!name || !email || !password || !department) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'El correo ya está registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User and Specialist in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'especialista',
          department
        }
      });

      const specialist = await tx.specialist.create({
        data: {
          userId: user.id,
          name,
          department,
          email,
          active: true
        },
        include: { schedules: true }
      });

      return specialist;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating specialist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/specialists/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, email, password, active } = req.body;

    const specialist = await prisma.specialist.findUnique({ where: { id } });
    if (!specialist) return res.status(404).json({ error: 'No encontrado' });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      // Update User
      await tx.user.update({
        where: { id: specialist.userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(department && { department }),
          ...(hashedPassword && { password: hashedPassword })
        }
      });

      // Update Specialist
      return await tx.specialist.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(department && { department }),
          ...(active !== undefined && { active })
        },
        include: { schedules: true }
      });
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating specialist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/specialists/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const specialist = await prisma.specialist.findUnique({ where: { id } });
    if (!specialist) return res.status(404).json({ error: 'No encontrado' });

    await prisma.$transaction(async (tx) => {
      await tx.specialist.delete({ where: { id } });
      await tx.user.delete({ where: { id: specialist.userId } });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting specialist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/specialists/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const specialist = await prisma.specialist.findUnique({
      where: { id },
      include: {
        schedules: true
      }
    });

    if (!specialist) return res.status(404).json({ error: 'No encontrado' });
    res.json(specialist);
  } catch (error) {
    console.error('Error fetching specialist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/specialists/:id/available-slots
router.get('/:id/available-slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD
    
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Fecha requerida' });
    }

    const d = new Date(date + "T12:00:00");
    const dayOfWeek = d.getDay();
    
    // Calculate week: 0 for current week, 1 for next week
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    
    // Simple week calculation: if date is > 6 days from today, it's next week
    const requestedWeek = diffDays > 6 ? 1 : 0;

    const specialist = await prisma.specialist.findUnique({
      where: { id },
      include: { schedules: true }
    });

    if (!specialist) return res.status(404).json({ error: 'No encontrado' });

    // Filter by day of week AND week (if week is null, it's for both weeks)
    const activeSlotsForDay = specialist.schedules.filter((s: any) => 
      s.dayOfWeek === dayOfWeek && 
      s.available && 
      (s.week === null || s.week === requestedWeek)
    );

    const appointmentsOnDate = await prisma.appointment.findMany({
      where: { specialistId: id, date: date, status: { not: "Cancelada" } }
    });

    const occupiedTimes = new Set(appointmentsOnDate.map((a: any) => a.time));
    
    const resultsSet = new Set<string>();
    activeSlotsForDay.forEach((slot: any) => {
      if (!occupiedTimes.has(slot.startTime)) {
        resultsSet.add(slot.startTime);
      }
    });

    res.json(Array.from(resultsSet).sort());
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/specialists/:id/schedules
router.post('/:id/schedules', async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, week } = req.body;

    const slot = await prisma.scheduleSlot.create({
      data: {
        specialistId: id,
        dayOfWeek,
        startTime,
        endTime,
        week: week === undefined ? null : week
      }
    });

    res.json(slot);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/specialists/:id/schedules/:slotId
router.delete('/:id/schedules/:slotId', async (req, res) => {
  try {
    const { slotId } = req.params;
    await prisma.scheduleSlot.delete({ where: { id: slotId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
