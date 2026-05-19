import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRegistration } from '../entities/event-registration.entity';
import { CreateEventRegistrationDto, UpdateEventRegistrationDto } from '../dtos/event-registration.dto';

@Injectable()
export class EventRegistrationsService {
    constructor(
        @InjectRepository(EventRegistration)
        private regRepo: Repository<EventRegistration>,
    ) {}

    async findAll() {
        return this.regRepo.find({ relations: ['user', 'event'] });
    }

    async findOne(id: number) {
        const reg = await this.regRepo.findOne({
            where: { id },
            relations: ['user', 'event'],
        });
        if (!reg) {
            throw new NotFoundException(`Event Registration #${id} not found`);
        }
        return reg;
    }

    async create(dto: CreateEventRegistrationDto) {
        const reg = this.regRepo.create(dto);
        return this.regRepo.save(reg);
    }

    async update(id: number, dto: UpdateEventRegistrationDto) {
        const reg = await this.findOne(id);
        this.regRepo.merge(reg, dto);
        return this.regRepo.save(reg);
    }

    async remove(id: number) {
        const reg = await this.findOne(id);
        return this.regRepo.remove(reg);
    }
}
