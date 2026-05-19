import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from '../entities/machine.entity';
import { CreateMachineDto, UpdateMachineDto } from '../dtos/machine.dto';

@Injectable()
export class MachinesService {
    constructor(
        @InjectRepository(Machine) private machineRepo: Repository<Machine>,
    ) {}

    async findAll() {
        return this.machineRepo.find();
    }

    async findOne(id: number) {
        const machine = await this.machineRepo.findOne({ where: { id } });
        if (!machine) {
            throw new NotFoundException(`Machine #${id} not found`);
        }
        return machine;
    }

    async create(dto: CreateMachineDto) {
        const machine = this.machineRepo.create(dto);
        return this.machineRepo.save(machine);
    }

    async update(id: number, dto: UpdateMachineDto) {
        const machine = await this.findOne(id);
        this.machineRepo.merge(machine, dto);
        return this.machineRepo.save(machine);
    }

    async remove(id: number) {
        const machine = await this.findOne(id);
        return this.machineRepo.remove(machine);
    }
}
