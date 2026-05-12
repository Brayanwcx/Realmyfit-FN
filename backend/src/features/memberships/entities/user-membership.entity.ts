import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Membership } from './membership.entity';

export enum MembershipStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

@Entity('user_memberships')
export class UserMembership {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    startDate: string;

    @Column({ type: 'date' })
    endDate: string;

    @Column({
        type: 'enum',
        enum: MembershipStatus,
        default: MembershipStatus.ACTIVE,
    })
    status: MembershipStatus;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.userMemberships, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    user_id: number;

    @ManyToOne(() => Membership, (membership) => membership.userMemberships, { eager: true })
    @JoinColumn({ name: 'membership_id' })
    membership: Membership;

    @Column()
    membership_id: number;
}


