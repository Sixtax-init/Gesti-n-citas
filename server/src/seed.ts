import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  // Clean up
  await prisma.notification.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.appEvent.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.specialist.deleteMany();
  await prisma.user.deleteMany();
  
  // Hash password helper
  const hash = async (pwd: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pwd, salt);
  };

  const adminPwd = await hash("admin123");
  const alumnoPwd = await hash("alumno123");
  const espPwd = await hash("esp123");

  // 1. Users
  const u1 = await prisma.user.create({
    data: { id: "u1", email: "admin@instituto.edu.mx", password: adminPwd, name: "Admin Sistema", role: "admin" }
  });
  const u2 = await prisma.user.create({
    data: { id: "u2", email: "alumno@instituto.edu.mx", password: alumnoPwd, name: "María García López", role: "alumno", matricula: "20210001", carrera: "Ing. en Sistemas Computacionales", semestre: 5, edad: 21, genero: "Femenino" }
  });
  const u3 = await prisma.user.create({
    data: { id: "u3", email: "psicologo@instituto.edu.mx", password: espPwd, name: "Dr. Carlos Mendoza", role: "especialista", department: "Psicología" }
  });
  const u4 = await prisma.user.create({
    data: { id: "u4", email: "tutor@instituto.edu.mx", password: espPwd, name: "Mtra. Ana Ruiz", role: "especialista", department: "Tutorías" }
  });
  const u5 = await prisma.user.create({
    data: { id: "u5", email: "nutriologo@instituto.edu.mx", password: espPwd, name: "Lic. Roberto Sánchez", role: "especialista", department: "Nutrición" }
  });

  // 2. Specialists & Schedules
  const s1 = await prisma.specialist.create({
    data: {
      id: "s1", userId: "u3", name: "Dr. Carlos Mendoza", department: "Psicología", email: "psicologo@instituto.edu.mx", active: true,
      schedules: {
        create: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", available: true },
          { dayOfWeek: 1, startTime: "10:00", endTime: "11:00", available: true },
          { dayOfWeek: 1, startTime: "11:00", endTime: "12:00", available: true },
          { dayOfWeek: 3, startTime: "09:00", endTime: "10:00", available: true },
          { dayOfWeek: 3, startTime: "10:00", endTime: "11:00", available: true },
          { dayOfWeek: 5, startTime: "14:00", endTime: "15:00", available: true },
          { dayOfWeek: 5, startTime: "15:00", endTime: "16:00", available: true }
        ]
      }
    }
  });

  const s2 = await prisma.specialist.create({
    data: {
      id: "s2", userId: "u4", name: "Mtra. Ana Ruiz", department: "Tutorías", email: "ana.ruiz@instituto.edu.mx", active: true,
      schedules: {
        create: [
          { dayOfWeek: 2, startTime: "08:00", endTime: "09:00", available: true },
          { dayOfWeek: 2, startTime: "09:00", endTime: "10:00", available: true },
          { dayOfWeek: 4, startTime: "10:00", endTime: "11:00", available: true },
          { dayOfWeek: 4, startTime: "11:00", endTime: "12:00", available: true }
        ]
      }
    }
  });

  const s3 = await prisma.specialist.create({
    data: {
      id: "s3", userId: "u5", name: "Lic. Roberto Sánchez", department: "Nutrición", email: "roberto.s@instituto.edu.mx", active: true,
      schedules: {
        create: [
          { dayOfWeek: 1, startTime: "13:00", endTime: "14:00", available: true },
          { dayOfWeek: 1, startTime: "14:00", endTime: "15:00", available: true },
          { dayOfWeek: 3, startTime: "13:00", endTime: "14:00", available: true },
          { dayOfWeek: 5, startTime: "09:00", endTime: "10:00", available: true }
        ]
      }
    }
  });

  // 3. Appointments
  await prisma.appointment.createMany({
    data: [
      { id: "a1", studentId: "u2", studentName: "María García López", specialistId: "s1", specialistName: "Dr. Carlos Mendoza", department: "Psicología", date: "2026-03-16", time: "09:00", status: "Confirmada", modality: "Presencial", motivo: "Estrés académico y ansiedad" },
      { id: "a2", studentId: "u2", studentName: "María García López", specialistId: "s2", specialistName: "Mtra. Ana Ruiz", department: "Tutorías", date: "2026-03-18", time: "09:00", status: "Pendiente", modality: "Virtual", motivo: "Asesoría en materias de programación" },
      { id: "a3", studentId: "u2", studentName: "María García López", specialistId: "s1", specialistName: "Dr. Carlos Mendoza", department: "Psicología", date: "2026-02-10", time: "10:00", status: "Completada", modality: "Presencial", motivo: "Orientación vocacional", notes: "Seguimiento en 2 semanas." },
      { id: "a4", studentId: "u2", studentName: "María García López", specialistId: "s2", specialistName: "Mtra. Ana Ruiz", department: "Tutorías", date: "2026-01-22", time: "10:00", status: "Completada", modality: "Virtual", motivo: "Planificación académica" },
    ]
  });

  // 4. Events
  await prisma.appEvent.createMany({
    data: [
      { id: "e1", title: "Taller: Manejo del Estrés Académico", description: "Técnicas efectivas para manejar el estrés.", department: "Psicología", date: "2026-03-15", time: "10:00", type: "taller", imageUrl: "https://images.unsplash.com/photo-1607551848581-7ee851bf978b?w=400&q=80" },
      { id: "e2", title: "Feria de Nutrición Saludable", description: "Evaluaciones nutricionales gratuitas.", department: "Nutrición", date: "2026-03-20", time: "09:00", type: "taller", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" },
      { id: "e3", title: "Tutoría Grupal: Matemáticas", description: "Sesión abierta para resolver dudas.", department: "Tutorías", date: "2026-03-18", time: "14:00", type: "taller", imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80" },
      { id: "e4", title: "Conferencia: Salud Mental", description: "Ponencia sobre salud mental.", department: "Psicología", date: "2026-03-25", time: "11:00", type: "conferencia", imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80" }
    ]
  });

  // 5. Resources
  await prisma.resource.createMany({
    data: [
      { id: "r1", department: "Psicología", type: "image", title: "Infografía: Técnicas de Relajación", description: "Guía con 5 técnicas.", url: "#", imageUrl: "https://images.unsplash.com/photo-1607551848581-7ee851bf978b?w=400&q=80" },
      { id: "r2", department: "Psicología", type: "video", title: "Video: Manejo de la Ansiedad", description: "Sesión grabada.", url: "#" },
      { id: "r3", department: "Tutorías", type: "image", title: "Infografía: Técnicas de Estudio", description: "Métodos probados.", url: "#", imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80" },
      { id: "r4", department: "Nutrición", type: "image", title: "Infografía: Plan Alimenticio", description: "Opciones de comidas.", url: "#", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80" }
    ]
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
