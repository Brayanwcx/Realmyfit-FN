import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRegistration } from './entities/event-registration.entity';
import { EventRegistrationsService } from './services/event-registrations.service';
import { EventRegistrationsController } from './controllers/event-registrations.controller';

@Module({
    imports: [TypeOrmModule.forFeature([EventRegistration])],
    providers: [EventRegistrationsService],
    controllers: [EventRegistrationsController],
    exports: [EventRegistrationsService],
})
export class EventRegistrationsModule {}
