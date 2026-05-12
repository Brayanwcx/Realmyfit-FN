import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { CreateEventDto, UpdateEventDto } from '../dtos/event.dto';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event) private eventRepo: Repository<Event>,
    ) {}

    async findAll() {
        return this.eventRepo.find({ relations: ['registrations'] });
    }

    async findOne(id: number) {
        const event = await this.eventRepo.findOne({
            where: { id },
            relations: ['registrations'],
        });
        if (!event) {
            throw new NotFoundException(`Event #${id} not found`);
        }
        return event;
    }

    async create(dto: CreateEventDto) {
        const event = this.eventRepo.create(dto);
        return this.eventRepo.save(event);
    }

    async update(id: number, dto: UpdateEventDto) {
        const event = await this.findOne(id);
        this.eventRepo.merge(event, dto);
        return this.eventRepo.save(event);
    }

    async remove(id: number) {
        const event = await this.findOne(id);
        return this.eventRepo.remove(event);
    }
}
