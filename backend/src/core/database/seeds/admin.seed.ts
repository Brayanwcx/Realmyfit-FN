import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../features/users/entities/user.entity';
import { Role } from '../../../features/roles/entities/role.entity';

const ADMIN_EMAIL = 'admin@realmyfit.com';
const ADMIN_PASSWORD = 'Admin123!';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

  const adminRole = await roleRepo.findOne({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    console.error('⚠️  Rol ADMIN no encontrado. Ejecuta primero el seed de roles.');
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existing = await userRepo.findOne({
    where: { email: ADMIN_EMAIL },
    relations: ['roles'],
  });

  if (existing) {
    existing.password = hashedPassword;
    existing.isActive = true;
    if (!existing.roles?.some((r) => r.name === 'ADMIN')) {
      existing.roles = [...(existing.roles ?? []), adminRole];
    }
    await userRepo.save(existing);
    console.log(`ℹ️  Usuario admin actualizado: ${ADMIN_EMAIL}`);
    return;
  }

  const admin = userRepo.create({
    name: 'Administrador',
    lastName: 'RealMyFit',
    docType: 'CC',
    docNumber: '0000000000',
    email: ADMIN_EMAIL,
    password: hashedPassword,
    isActive: true,
    roles: [adminRole],
  });

  await userRepo.save(admin);
  console.log(`✅ Usuario admin creado: ${ADMIN_EMAIL}`);
}
