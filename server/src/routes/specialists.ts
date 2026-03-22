import { Router } from 'express';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import { verifyToken, AuthRequest } from '../middleware/verifyToken';

const router = Router();

// GET /api/specialists
router.get('/', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const department = req.query.department as string | undefined;
    const where: any = {};
    if (department) where.department = department;

    const specialists = await prisma.specialist.findMany({
      where,
      include: { schedules: true }
    });

    res.json(specialists);
  } catch (error) {
    console.error('Error fetching specialists:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/specialists — admin only
router.post('/', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const { name, department, email, password, shift } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'El correo ya está registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, name, role: 'especialista', department }
      });

      return await tx.specialist.create({
        data: { userId: user.id, name, department, email, active: true, shift: shift || 'Matutino' },
        include: { schedules: true }
      });
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating specialist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/specialists/:id — admin only
router.patch('/:id', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const id = req.params.id as string;
    const { name, department, email, password, active, shift } = req.body;

    const specialist = await prisma.specialist.findUnique({ where: { id } });
    if (!specialist) return res.status(404).json({ error: 'No encontrado' });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: specialist.userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(department && { department }),
          ...(hashedPassword && { password: hashedPassword })
        }
      });

      return await tx.specialist.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(department && { department }),
          ...(active !== undefined && { active }),
          ...(shift && { shift })
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

// DELETE /api/specialists/:id — admin only
router.delete('/:id', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const id = req.params.id as string;
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
router.get('/:id', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    const specialist = await prisma.specialist.findUnique({
      where: { id },
      include: { schedules: true }
    });

    if (!specialist) return res.status(404).json({ error: 'No encontrado' });
    res.json(specialist);
  } catch (error) {
    console.error('Error fetching specialist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/specialists/:id/available-slots
router.get('/:id/available-slots', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const date = req.query.date as string | undefined;

    if (!date) return res.status(400).json({ error: 'Fecha requerida' });

    const requestedDate = new Date(date + 'T12:00:00');
    requestedDate.setHours(0, 0, 0, 0);
    const dayOfWeek = requestedDate.getDay();

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayShift = now.getDay() === 0 ? 1 : 1 - now.getDay();
    const mondayOfCurrentWeek = new Date(now);
    mondayOfCurrentWeek.setDate(now.getDate() + dayShift);

    const diffMs = requestedDate.getTime() - mondayOfCurrentWeek.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 3600 * 1000));
    const requestedWeek = Math.max(0, diffWeeks);

    const specialist = await prisma.specialist.findUnique({
      where: { id },
      include: { schedules: true }
    });

    if (!specialist) return res.status(404).json({ error: 'No encontrado' });

    let activeSlotsForDay = specialist.schedules.filter((s: any) =>
      s.specificDate === date && s.available
    );

    if (activeSlotsForDay.length === 0) {
      activeSlotsForDay = specialist.schedules.filter((s: any) =>
        s.dayOfWeek === dayOfWeek &&
        s.available &&
        s.specificDate === null &&
        (s.week === null || s.week === requestedWeek)
      );
    }

    const appointmentsOnDate = await prisma.appointment.findMany({
      where: { specialistId: id, date, status: { not: 'Cancelada' } }
    });

    const occupiedTimes = new Set(appointmentsOnDate.map((a: any) => a.time));
    const resultsSet = new Set<string>();
    activeSlotsForDay.forEach((slot: any) => {
      if (!occupiedTimes.has(slot.startTime)) resultsSet.add(slot.startTime);
    });

    res.json(Array.from(resultsSet).sort());
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/specialists/:id/schedules — specialist (own) or admin
router.post('/:id/schedules', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const caller = req.user!;

    if (caller.role !== 'admin') {
      const spec = await prisma.specialist.findUnique({ where: { id } });
      if (!spec || spec.userId !== caller.id) {
        return res.status(403).json({ error: 'Sin permisos' });
      }
    }

    const { dayOfWeek, startTime, endTime, week, specificDate } = req.body;

    const slot = await prisma.scheduleSlot.create({
      data: {
        specialistId: id,
        dayOfWeek,
        startTime,
        endTime,
        week: week === undefined ? null : (week === 'both' ? null : parseInt(String(week))),
        specificDate: specificDate || null
      }
    });

    res.json(slot);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/specialists/:id/schedules/:slotId — specialist (own) or admin
router.delete('/:id/schedules/:slotId', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const slotId = req.params.slotId as string;
    const caller = req.user!;

    if (caller.role !== 'admin') {
      const spec = await prisma.specialist.findUnique({ where: { id } });
      if (!spec || spec.userId !== caller.id) {
        return res.status(403).json({ error: 'Sin permisos' });
      }
    }

    await prisma.scheduleSlot.delete({ where: { id: slotId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
