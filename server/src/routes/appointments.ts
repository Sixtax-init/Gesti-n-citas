import { Router } from 'express';
import { prisma } from '../db';
import { verifyToken, AuthRequest } from '../middleware/verifyToken';

const router = Router();

// GET /api/appointments
router.get('/', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const { studentId, specialistId, department, status } = req.query;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (specialistId) where.specialistId = specialistId;
    if (department) where.department = department;
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/appointments
router.post('/', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const data = req.body;

    if (!data.studentId || !data.specialistId || !data.date || !data.time) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        studentId: data.studentId,
        studentName: data.studentName,
        specialistId: data.specialistId,
        specialistName: data.specialistName,
        department: data.department,
        date: data.date,
        time: data.time,
        status: data.status || 'Pendiente',
        modality: data.modality,
        motivo: data.motivo,
        notes: data.notes
      }
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Error al crear la cita' });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { status, notes } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined && { notes })
      }
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Error al actualizar la cita' });
  }
});

// PATCH /api/appointments/:id/reschedule
router.patch('/:id/reschedule', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { date, time, modality } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        date,
        time,
        ...(modality && { modality })
      }
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Error al reagendar la cita' });
  }
});

export default router;
