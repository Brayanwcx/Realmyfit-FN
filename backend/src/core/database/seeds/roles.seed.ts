import { DataSource } from 'typeorm';
import { Role } from '../../../features/roles/entities/role.entity';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository(Role);

  const defaultRoles = [
    { id: 1, name: 'ADMIN', description: 'Administrador del sistema con acceso total' },
    { id: 2, name: 'USER', description: 'Usuario regular con acceso estándar' },
    { id: 3, name: 'TRAINER', description: 'Entrenador con acceso a gestión de rutinas' },
  ];

  for (const roleData of defaultRoles) {
    const exists = await roleRepo.findOne({ where: { id: roleData.id } });
    if (!exists) {
      const role = roleRepo.create(roleData);
      await roleRepo.save(role);
      console.log(`✅ Rol creado: ${roleData.name}`);
    } else {
      console.log(`ℹ️  Rol ya existe: ${roleData.name}`);
    }
  }
}
