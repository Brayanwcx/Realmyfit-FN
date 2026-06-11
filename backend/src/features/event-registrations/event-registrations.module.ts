import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRegistration } from './entities/event-registration.entity';
import { Event } from '../events/entities/event.entity';
import { Payment } from '../payments/entities/payment.entity';
import { EventRegistrationsService } from './services/event-registrations.service';
import { EventRegistrationsController } from './controllers/event-registrations.controller';

@Module({
    imports: [TypeOrmModule.forFeature([EventRegistration, Event, Payment])],
    providers: [EventRegistrationsService],
    controllers: [EventRegistrationsController],
    exports: [EventRegistrationsService],
})
export class EventRegistrationsModule {}
