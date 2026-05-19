import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from 'typeorm';

@Entity('contacts')
export class Contact {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 255 })
    subject: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
