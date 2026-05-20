import { DataSource } from 'typeorm';
import { User } from '../../../features/users/entities/user.entity';
import { Role } from '../../../features/roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

  // Buscar rol ADMIN
  const adminRole = await roleRepo.findOne({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    console.log('⚠️  Rol ADMIN no encontrado. Ejecuta seedRoles primero.');
    return;
  }

  // Verificar si ya existe un usuario admin
  const existingAdmin = await userRepo.findOne({
    where: { email: 'admin@realmyfit.com' },
    relations: ['roles']
  });

  if (existingAdmin) {
    console.log('ℹ️  Usuario admin ya existe: admin@realmyfit.com');
    return;
  }

  // Crear usuario admin por defecto
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = userRepo.create({
    name: 'Admin',
    lastName: 'System',
    email: 'admin@realmyfit.com',
    password: hashedPassword,
    docType: 'CC',
    docNumber: '1234567890',
    isActive: true,
    roles: [adminRole]
  });

  await userRepo.save(adminUser);
  console.log('✅ Usuario admin creado: admin@realmyfit.com / admin123');
}
