import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { EventRegistration } from '../../event-registrations/entities/event-registration.entity';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    time: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    @Column({ type: 'int', default: 0 })
    capacity: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => EventRegistration, (reg) => reg.event)
    registrations: EventRegistration[];
}


