import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

export enum RegistrationStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
}

@Entity('event_registrations')
export class EventRegistration {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    registrationDate: Date;

    @Column({
        type: 'enum',
        enum: RegistrationStatus,
        default: RegistrationStatus.PENDING,
    })
    status: RegistrationStatus;

    @ManyToOne(() => User, (user) => user.eventRegistrations, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    user_id: number;

    @ManyToOne(() => Event, (event) => event.registrations, { eager: true })
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @Column()
    event_id: number;
}


