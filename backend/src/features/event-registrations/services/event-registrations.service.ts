import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EventRegistration,
  RegistrationStatus,
} from '../entities/event-registration.entity';
import { Event } from '../../events/entities/event.entity';
import {
  CreateEventRegistrationDto,
  UpdateEventRegistrationDto,
} from '../dtos/event-registration.dto';

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

  private async getEventWithRegistrations(eventId: number) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['registrations'],
    });
    if (!event) {
      throw new NotFoundException(`Event #${eventId} not found`);
    }
    return event;
  }

  private getActiveRegistrations(event: Event) {
    return (event.registrations || []).filter(
      (r) => r.status !== RegistrationStatus.CANCELLED,
    );
  }

  private assertCapacityAvailable(event: Event) {
    const activeRegs = this.getActiveRegistrations(event);
    if (event.capacity > 0 && activeRegs.length >= event.capacity) {
      throw new BadRequestException(
        'No hay cupos disponibles para este evento.',
      );
    }
  }

  async create(dto: CreateEventRegistrationDto) {
    const event = await this.getEventWithRegistrations(dto.event_id);

    if (!event.isActive) {
      throw new BadRequestException('Este evento no está disponible.');
    }

    if (Number(event.price) > 0) {
      throw new BadRequestException(
        'Este evento requiere pago. Completa el proceso de compra.',
      );
    }

    const existing = await this.regRepo.findOne({
      where: {
        user_id: dto.user_id,
        event_id: dto.event_id,
      },
    });

    if (existing && existing.status !== RegistrationStatus.CANCELLED) {
      throw new ForbiddenException(
        'Ya te encuentras registrado/a en este evento.',
      );
    }

    this.assertCapacityAvailable(event);

    const reg = this.regRepo.create({
      ...dto,
      status: RegistrationStatus.CONFIRMED,
    });
    return this.regRepo.save(reg);
  }

  async confirmPaidRegistration(userId: number, eventId: number) {
    const event = await this.getEventWithRegistrations(eventId);

    if (!event.isActive) {
      throw new BadRequestException('Este evento no está disponible.');
    }

    if (Number(event.price) <= 0) {
      throw new BadRequestException(
        'Este evento es gratuito y no requiere pago.',
      );
    }

    const existing = await this.regRepo.findOne({
      where: {
        user_id: userId,
        event_id: eventId,
      },
    });

    if (existing && existing.status === RegistrationStatus.CONFIRMED) {
      return existing;
    }

    if (existing && existing.status !== RegistrationStatus.CANCELLED) {
      existing.status = RegistrationStatus.CONFIRMED;
      return this.regRepo.save(existing);
    }

    this.assertCapacityAvailable(event);

    const reg = this.regRepo.create({
      user_id: userId,
      event_id: eventId,
      status: RegistrationStatus.CONFIRMED,
    });
    return this.regRepo.save(reg);
  }

  async update(id: number, dto: UpdateEventRegistrationDto) {
    const reg = await this.findOne(id);
    this.regRepo.merge(reg, dto);
    return this.regRepo.save(reg);
  }

  async cancelOwn(id: number, userId: number) {
    const reg = await this.regRepo.findOne({
      where: { id },
      relations: ['user', 'event'],
    });
    if (!reg)
      throw new NotFoundException(`Event Registration #${id} not found`);
    if (reg.user?.id !== userId)
      throw new ForbiddenException(
        'No puedes cancelar una inscripción que no es tuya.',
      );

    if (reg.event?.date) {
      const eventDate = new Date(reg.event.date);
      if (eventDate < new Date()) {
        throw new ForbiddenException(
          'No puedes cancelar la inscripción a un evento que ya ocurrió.',
        );
      }
    }

    reg.status = RegistrationStatus.CANCELLED;
    return this.regRepo.save(reg);
  }

  async cancelUserRegistration(userId: number, id: number) {
    return this.cancelOwn(id, userId);
  }

  async remove(id: number) {
    const reg = await this.findOne(id);
    return this.regRepo.remove(reg);
  }
}
