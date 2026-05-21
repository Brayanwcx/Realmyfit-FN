import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum MachineStatus {
    AVAILABLE = 'AVAILABLE',
    IN_MAINTENANCE = 'IN_MAINTENANCE',
    OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

@Entity('machines')
export class Machine {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    brand: string;


    @Column({
        type: 'enum',
        enum: MachineStatus,
        default: MachineStatus.AVAILABLE,
    })
    status: MachineStatus;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    category: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    videoUrl: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    maxLoad: string;


    @Column({ type: 'varchar', length: 255, nullable: true })
    muscleFocus: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    recommendedLevel: string;

    @Column({ type: 'date', nullable: true })
    acquisitionDate: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
