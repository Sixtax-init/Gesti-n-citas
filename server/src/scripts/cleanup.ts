import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando LIMPIEZA TOTAL de base de datos...');

  try {
    // Orden de borrado para respetar llaves foráneas
    await prisma.notification.deleteMany();
    console.log('- Notificaciones eliminadas');

    await prisma.resource.deleteMany();
    console.log('- Recursos eliminados');

    await prisma.appEvent.deleteMany();
    console.log('- Eventos eliminados');

    await prisma.appointment.deleteMany();
    console.log('- Citas eliminadas');

    await prisma.scheduleSlot.deleteMany();
    console.log('- Horarios eliminados');

    await prisma.specialist.deleteMany();
    console.log('- Especialistas eliminados');

    // Borrar todos los usuarios EXCEPTO el administrador maestro para no bloquear el acceso
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        NOT: {
          email: 'admin@instituto.edu.mx'
        }
      }
    });
    console.log(`- ${deletedUsers.count} Usuarios eliminados (excepto admin principal)`);

    console.log('\n✅ Base de datos reseteada a estado casi-cero.');
    console.log('💡 Los datos iniciales "hardcodeados" están en "server/src/seed.ts".');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
