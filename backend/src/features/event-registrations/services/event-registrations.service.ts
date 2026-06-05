import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
        // Fix: Prevent double registrations
        const existing = await this.regRepo.findOne({
            where: {
                user_id: dto.user_id,
                event_id: dto.event_id,
            }
        });
        
        // If the user already has a registration that is not cancelled
        if (existing && existing.status !== ('CANCELLED' as any)) {
            throw new ForbiddenException('Ya te encuentras registrado/a en este evento.');
        }

        const reg = this.regRepo.create(dto);
        return this.regRepo.save(reg);
    }

    async update(id: number, dto: UpdateEventRegistrationDto) {
        const reg = await this.findOne(id);
        this.regRepo.merge(reg, dto);
        return this.regRepo.save(reg);
    }

    async cancelOwn(id: number, userId: number) {
        const reg = await this.regRepo.findOne({ where: { id }, relations: ['user', 'event'] });
        if (!reg) throw new NotFoundException(`Event Registration #${id} not found`);
        if (reg.user?.id !== userId) throw new ForbiddenException('No puedes cancelar una inscripción que no es tuya.');
        
        if (reg.event?.date) {
            const eventDate = new Date(reg.event.date);
            if (eventDate < new Date()) {
                throw new ForbiddenException('No puedes cancelar la inscripción a un evento que ya ocurrió.');
            }
        }

        reg.status = 'CANCELLED' as any;
        return this.regRepo.save(reg);
    }

    async remove(id: number) {
        const reg = await this.findOne(id);
        return this.regRepo.remove(reg);
    }
}

