import { Role } from '../../roles/entities/role.entity';
import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { EventRegistration } from '../../event-registrations/entities/event-registration.entity';
import { UserMembership } from '../../memberships/entities/user-membership.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Order } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name;

    @Column({ type: 'varchar', length: 255 })
    lastName;

    @Column({ type: 'varchar', length: 255 })
    docType;

    @Column({ type: 'varchar', length: 255 })
    docNumber;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'varchar', length: 500, nullable: true })
    profilePicture: string;

    @ManyToMany(() => Role, role => role.users)
    @JoinTable({
        name: 'user_roles'
    })
    roles: Role[];

    @OneToMany(() => EventRegistration, (reg) => reg.user)
    eventRegistrations: EventRegistration[];

    @OneToMany(() => UserMembership, (um) => um.user)
    userMemberships: UserMembership[];

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @OneToMany(() => Payment, (payment) => payment.user)
    payments: Payment[];

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

    @ManyToMany(() => Product)
    @JoinTable({
        name: 'user_wishlist'
    })
    wishlist: Product[];
}


