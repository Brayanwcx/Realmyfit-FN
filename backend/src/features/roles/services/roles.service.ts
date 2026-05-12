import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role) private roleRepo: Repository<Role>,
    ) {}

    async findAll() {
        return await this.roleRepo.find();
    }

    async findOne(id: number) {
        const role = await this.roleRepo.findOne({ where: { id } });
        if (!role) {
            throw new NotFoundException(`Role #${id} not found`);
        }
        return role;
    }

    async create(data: { name: string, description?: string }) {
        const newRole = this.roleRepo.create(data);
        return this.roleRepo.save(newRole);
    }
    
    async findByIds(ids: number[]) {
        return await this.roleRepo.find({ where: { id: In(ids) } });
    }
}
