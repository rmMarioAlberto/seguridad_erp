import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Permisos
  const permisosData = [
    { nombre: 'tickets:view', descripcion: 'Ver tickets' },
    { nombre: 'tickets:add', descripcion: 'Crear tickets' },
    { nombre: 'tickets:edit', descripcion: 'Editar tickets' },
    { nombre: 'tickets:delete', descripcion: 'Eliminar tickets' },
    { nombre: 'tickets:move', descripcion: 'Cambiar estado de tickets' },
    { nombre: 'groups:manage', descripcion: 'Gestionar grupos y miembros' },
    { nombre: 'users:manage', descripcion: 'Gestionar usuarios' },
    { nombre: 'metrics:view', descripcion: 'Ver métricas del sistema' },
    { nombre: 'logs:view', descripcion: 'Ver logs de auditoría' },
  ];

  for (const p of permisosData) {
    await prisma.permiso.upsert({
      where: { nombre: p.nombre },
      update: {},
      create: p,
    });
  }

  // 2. Estados
  const estadosData = [
    { id: 1, nombre: 'Abierto', color: '#3b82f6' }, // blue
    { id: 2, nombre: 'En Progreso', color: '#eab308' }, // yellow
    { id: 3, nombre: 'Resuelto', color: '#22c55e' }, // green
    { id: 4, nombre: 'Cerrado', color: '#6b7280' }, // gray
  ];

  for (const e of estadosData) {
    await prisma.estado.upsert({
      where: { id: e.id },
      update: e,
      create: e,
    });
  }

  // 3. Prioridades
  const prioridadesData = [
    { id: 1, nombre: 'Baja', orden: 1 },
    { id: 2, nombre: 'Media', orden: 2 },
    { id: 3, nombre: 'Alta', orden: 3 },
    { id: 4, nombre: 'Urgente', orden: 4 },
  ];

  for (const p of prioridadesData) {
    await prisma.prioridad.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  // 4. Usuario Admin inicial
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      nombre_completo: 'Administrador del Sistema',
      username: 'admin',
      email: 'admin@erp.com',
      password: hash,
      fecha_inicio: new Date(),
    },
  });

  console.log('✅ Seed completado!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
