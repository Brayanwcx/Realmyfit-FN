import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { EventRegistration, RegistrationStatus } from '../entities/event-registration.entity';
import { Event } from '../../events/entities/event.entity';
import { CreateEventRegistrationDto, UpdateEventRegistrationDto } from '../dtos/event-registration.dto';

@Injectable()
export class EventRegistrationsService {
    constructor(
        @InjectRepository(EventRegistration)
        private regRepo: Repository<EventRegistration>,
        @InjectRepository(Event)
        private eventRepo: Repository<Event>,
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
        // 1. Check for duplicates
        const existing = await this.regRepo.findOne({
            where: {
                user_id: dto.user_id,
                event_id: dto.event_id,
                status: Not(RegistrationStatus.CANCELLED)
            }
        });
        if (existing) {
            throw new ConflictException('Ya estás inscrito en este evento');
        }

        // 2. Check capacity
        const event = await this.eventRepo.findOne({
            where: { id: dto.event_id },
            relations: ['registrations']
        });
        if (!event) {
            throw new NotFoundException('Evento no encontrado');
        }

        const activeRegs = event.registrations.filter(r => r.status !== RegistrationStatus.CANCELLED);
        if (activeRegs.length >= event.capacity) {
            throw new ConflictException('El evento está lleno (no hay más cupos)');
        }

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

    async cancel(id: number, userId: number, isAdmin: boolean) {
        const reg = await this.findOne(id);

        if (!isAdmin && reg.user_id !== userId) {
            throw new ForbiddenException('No tienes permiso para cancelar esta inscripción');
        }

        reg.status = RegistrationStatus.CANCELLED;
        return this.regRepo.save(reg);
    }
}
