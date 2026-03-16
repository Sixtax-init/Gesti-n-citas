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
    const { name, department, email, password, shift } = req.body;
    
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
          active: true,
          shift: shift || "Matutino"
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
    const { name, department, email, password, active, shift } = req.body;

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

    const requestedDate = new Date(date + "T12:00:00");
    requestedDate.setHours(0, 0, 0, 0);
    const dayOfWeek = requestedDate.getDay();
    
    // Calculate week relative to the "Current Planning Week"
    // If today is Sunday, the current planning week starts tomorrow (Monday)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayShift = now.getDay() === 0 ? 1 : 1 - now.getDay();
    const mondayOfCurrentWeek = new Date(now);
    mondayOfCurrentWeek.setDate(now.getDate() + dayShift);
    
    const diffMs = requestedDate.getTime() - mondayOfCurrentWeek.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 3600 * 1000));
    
    // Ensure we don't return negative weeks for previous days (though UI filters them)
    const requestedWeek = Math.max(0, diffWeeks);

    const specialist = await prisma.specialist.findUnique({
      where: { id },
      include: { schedules: true }
    });

    if (!specialist) return res.status(404).json({ error: 'No encontrado' });

    // Priority: 
    // 1. Slots with specificDate === date
    // 2. If no specificDate slots exist for this dayOfWeek, use recurring week slots
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
    const { dayOfWeek, startTime, endTime, week, specificDate } = req.body;

    const slot = await prisma.scheduleSlot.create({
      data: {
        specialistId: id,
        dayOfWeek,
        startTime,
        endTime,
        week: week === undefined ? null : (week === "both" ? null : parseInt(String(week))),
        specificDate: specificDate || null
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
