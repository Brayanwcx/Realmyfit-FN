import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { PaymentsService } from './services/payments.service';
import { PaymentsController } from './controllers/payments.controller';
import { MembershipsModule } from '../memberships/memberships.module';
import { EventsModule } from '../events/events.module';
import { EventRegistrationsModule } from '../event-registrations/event-registrations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment, Order, OrderItem, Product]),
        ConfigModule,
        MembershipsModule,
        EventsModule,
        EventRegistrationsModule,
    ],
    providers: [PaymentsService],
    controllers: [PaymentsController],
    exports: [PaymentsService],
})
export class PaymentsModule {}
