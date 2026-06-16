import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentMethod, PaymentStatus } from '../entities/payment.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Product } from '../../products/entities/product.entity';
import { CreatePaymentDto, UpdatePaymentDto, CreateCheckoutSessionDto, CreateMembershipCheckoutDto, CreateEventCheckoutDto } from '../dtos/payment.dto';
import { MembershipsService } from '../../memberships/services/memberships.service';
import { EventsService } from '../../events/services/events.service';
import { EventRegistrationsService } from '../../event-registrations/services/event-registrations.service';

@Injectable()
export class PaymentsService {
    private stripe: any;

    constructor(
        @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
        @InjectRepository(Order) private orderRepo: Repository<Order>,
        @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        private configService: ConfigService,
        private membershipsService: MembershipsService,
        private eventsService: EventsService,
        private eventRegistrationsService: EventRegistrationsService,
    ) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
            console.warn('[PaymentsService] STRIPE_SECRET_KEY not set – Stripe features will fail at runtime.');
            this.stripe = null as any;
        } else {
            this.stripe = new Stripe(secretKey);
        }
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────────

    async findAll() {
        return this.paymentRepo.find({ relations: ['user'] });
    }

    async findOne(id: number) {
        const payment = await this.paymentRepo.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!payment) {
            throw new NotFoundException(`Payment #${id} not found`);
        }
        return payment;
    }

    async create(dto: CreatePaymentDto) {
        const payment = this.paymentRepo.create(dto);
        return this.paymentRepo.save(payment);
    }

    async update(id: number, dto: UpdatePaymentDto) {
        const payment = await this.findOne(id);
        this.paymentRepo.merge(payment, dto);
        return this.paymentRepo.save(payment);
    }

    async markAsRefunded(id: number) {
        const payment = await this.findOne(id);
        if (payment.status !== PaymentStatus.PENDING_REFUND) {
            throw new BadRequestException(`Payment #${id} is not pending refund (status: ${payment.status}).`);
        }
        payment.status = PaymentStatus.REFUNDED;
        return this.paymentRepo.save(payment);
    }

    async remove(id: number) {
        const payment = await this.findOne(id);
        return this.paymentRepo.remove(payment);
    }

    private async deductStock(orderId: number) {
        const items = await this.orderItemRepo.find({ where: { order_id: orderId } });
        for (const item of items) {
            const product = await this.productRepo.findOne({ where: { id: item.product_id } });
            if (product) {
                product.stock = Math.max(0, product.stock - item.quantity);
                await this.productRepo.save(product);
            }
        }
    }

    // ─── STRIPE ──────────────────────────────────────────────────────────────────

    async createEventPaymentIntent(dto: CreateEventCheckoutDto) {
        if (!this.stripe) throw new BadRequestException('Stripe not configured.');

        const event = await this.eventsService.findOne(dto.eventId);
        if (!event || !event.isActive) {
            throw new BadRequestException('El evento no está disponible.');
        }
        const price = Number(event.price);
        if (price <= 0) {
            throw new BadRequestException('Este evento es gratuito y no requiere pago.');
        }

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(price * 100),
            currency: 'usd',
            metadata: {
                type: 'EVENT',
                userId: String(dto.userId),
                eventId: String(event.id),
            },
        });

        const payment = this.paymentRepo.create({
            amount: price,
            paymentMethod: PaymentMethod.STRIPE,
            status: PaymentStatus.PENDING,
            stripeSessionId: paymentIntent.id,
            description: `Evento Checkout - ${event.title}`,
            user_id: dto.userId,
        });
        await this.paymentRepo.save(payment);

        return { clientSecret: paymentIntent.client_secret };
    }

    async createMembershipPaymentIntent(dto: CreateMembershipCheckoutDto) {
        if (!this.stripe) throw new BadRequestException('Stripe not configured.');

        const membership = await this.membershipsService.findOne(dto.membershipId);
        if (!membership || !membership.isActive) {
            throw new BadRequestException('Membership is not available');
        }

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(membership.price * 100),
            currency: 'usd',
            metadata: {
                type: 'MEMBERSHIP',
                userId: String(dto.userId),
                membershipId: String(membership.id),
            },
        });

        // Save a Pending Payment for the Membership (No Order is created)
        const payment = this.paymentRepo.create({
            amount: membership.price,
            paymentMethod: PaymentMethod.STRIPE,
            status: PaymentStatus.PENDING,
            stripeSessionId: paymentIntent.id,
            description: `Membresía Checkout - ${membership.name}`,
            user_id: dto.userId,
        });
        await this.paymentRepo.save(payment);

        return { clientSecret: paymentIntent.client_secret };
    }

    async createPaymentIntent(dto: CreateCheckoutSessionDto) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');
        }

        let totalAmount = 0;
        const verifiedItems: any[] = [];

        for (const item of dto.items) {
            const productId = item.productId;
            if (!productId) {
                throw new BadRequestException(`El \`productId\` es requerido para cada item. Item: '${item.name}'`);
            }
            const product = await this.productRepo.findOne({ where: { id: productId } });
            if (!product) throw new BadRequestException(`Producto no encontrado: ID ${productId}`);
            if (product.stock < item.quantity) throw new BadRequestException(`Sin stock suficiente para '${product.name}'`);

            totalAmount += product.price * item.quantity;
            verifiedItems.push({
                ...item,
                price: product.price,
                name: product.name,
                productId: product.id,
            });
        }

        // Total calculation already complete (No shipping fee added)

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Stripe uses cents
            currency: 'usd',
            metadata: {
                userId: String(dto.userId),
            },
        });

        // Create Payment record
        const payment = this.paymentRepo.create({
            amount: totalAmount,
            paymentMethod: PaymentMethod.STRIPE,
            status: PaymentStatus.PENDING,
            stripeSessionId: paymentIntent.id,
            description: `Stripe Checkout – ${verifiedItems.length} item(s) + Envío`,
            user_id: dto.userId,
        });
        await this.paymentRepo.save(payment);

        // Create Order record linked to the Stripe Session ID in 'notes'
        const order = this.orderRepo.create({
            totalAmount,
            status: 'PENDING' as any,
            user_id: dto.userId,
            notes: paymentIntent.id,
        });
        await this.orderRepo.save(order);

        // Create OrderItems
        const orderItemsList = verifiedItems.map(item => {
            return this.orderItemRepo.create({
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: item.price * item.quantity,
            });
        });
        await this.orderItemRepo.save(orderItemsList);

        return { clientSecret: paymentIntent.client_secret };
    }

    async verifyPaymentIntent(clientSecret: string) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe is not configured.');
        }

        try {
            // Retrieve INTENT id from clientSecret if necessary
            const paymentIntentId = clientSecret.startsWith('pi_') && clientSecret.includes('_secret_') 
                                    ? clientSecret.split('_secret_')[0] 
                                    : clientSecret;
                                    
            const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            
            // Si el pago ya fue procesado correctamente:
            if (intent.status === 'succeeded') {
                if (intent.metadata?.type === 'MEMBERSHIP') {
                    const paymentDoc = await this.paymentRepo.findOne({ where: { stripeSessionId: intent.id } });
                    if (paymentDoc && paymentDoc.status !== PaymentStatus.COMPLETED) {
                        await this.paymentRepo.update({ id: paymentDoc.id }, { status: PaymentStatus.COMPLETED });
                        await this.membershipsService.subscribeUser(Number(intent.metadata.userId), Number(intent.metadata.membershipId));
                        return { success: true, status: 'succeeded', type: 'membership' };
                    }
                    return { success: true, status: 'already_processed', type: 'membership' };
                }

                if (intent.metadata?.type === 'EVENT') {
                    const paymentDoc = await this.paymentRepo.findOne({ where: { stripeSessionId: intent.id } });
                    if (paymentDoc && paymentDoc.status !== PaymentStatus.COMPLETED) {
                        await this.paymentRepo.update({ id: paymentDoc.id }, { status: PaymentStatus.COMPLETED });
                        await this.eventRegistrationsService.confirmPaidRegistration(
                            Number(intent.metadata.userId),
                            Number(intent.metadata.eventId),
                        );
                        return { success: true, status: 'succeeded', type: 'event', eventId: Number(intent.metadata.eventId) };
                    }
                    return { success: true, status: 'already_processed', type: 'event', eventId: Number(intent.metadata.eventId) };
                }

                const orderDoc = await this.orderRepo.findOne({ where: { notes: intent.id } });
                
                // Solo si encontramos la orden y aun esta pendiente para evitar restar multiple veces
                if (orderDoc && orderDoc.status !== 'CONFIRMED' as any) {
                    await this.paymentRepo.update(
                        { stripeSessionId: intent.id },
                        { status: PaymentStatus.COMPLETED },
                    );

                    await this.orderRepo.update(
                        { id: orderDoc.id },
                        { status: 'CONFIRMED' as any },
                    );
                    
                    // Disminuir Stock
                    await this.deductStock(orderDoc.id);
                    
                    return { success: true, status: 'succeeded', orderId: orderDoc.id };
                }
                return { success: true, status: 'already_processed', orderId: orderDoc?.id };
            }
            
            return { success: false, status: intent.status };
        } catch (err) {
            throw new BadRequestException(`Could not verify Stripe intent: ${err.message}`);
        }
    }

    async handleWebhookEvent(rawBody: Buffer, signature: string) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe is not configured.');
        }

        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new BadRequestException('STRIPE_WEBHOOK_SECRET not set.');
        }

        let event: any;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        } catch (err) {
            throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
        }

        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object as any;
            await this.paymentRepo.update(
                { stripeSessionId: intent.id },
                { status: PaymentStatus.COMPLETED },
            );
            
            if (intent.metadata?.type === 'MEMBERSHIP') {
                try {
                    await this.membershipsService.subscribeUser(Number(intent.metadata.userId), Number(intent.metadata.membershipId));
                    console.log(`[Stripe] Membership activated for intent ${intent.id}`);
                } catch (e) {
                    console.error('[Stripe] Failed to assign membership on webhook:', e);
                }
            } else if (intent.metadata?.type === 'EVENT') {
                try {
                    await this.eventRegistrationsService.confirmPaidRegistration(
                        Number(intent.metadata.userId),
                        Number(intent.metadata.eventId),
                    );
                    console.log(`[Stripe] Event registration confirmed for intent ${intent.id}`);
                } catch (e) {
                    console.error('[Stripe] Failed to confirm event registration on webhook:', e);
                }
            } else {
                const orderDoc = await this.orderRepo.findOne({ where: { notes: intent.id } });
                if (orderDoc) {
                    if (orderDoc.status !== 'CONFIRMED' as any) {
                        await this.orderRepo.update(
                            { id: orderDoc.id },
                            { status: 'CONFIRMED' as any },
                        );
                        await this.deductStock(orderDoc.id);
                    }
                }
                console.log(`[Stripe] Payment completed for intent ${intent.id}`);
            }
        }

        if (event.type === 'payment_intent.payment_failed') {
            const intent = event.data.object as any;
            await this.paymentRepo.update(
                { stripeSessionId: intent.id },
                { status: PaymentStatus.FAILED },
            );
            await this.orderRepo.update(
                { notes: intent.id },
                { status: 'CANCELLED' as any },
            );
        }

        return { received: true };
    }

    async cancelPaymentIntent(clientSecret: string) {
        if (!this.stripe) return;

        try {
            const paymentIntentId = clientSecret.startsWith('pi_') && clientSecret.includes('_secret_')
                ? clientSecret.split('_secret_')[0]
                : clientSecret;

            // Cancel intent on Stripe (if it is incomplete)
            const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            if (intent && intent.status === 'requires_payment_method') {
                await this.stripe.paymentIntents.cancel(paymentIntentId);
            }

            // Remove Order if it exists and is PENDING
            const orderDoc = await this.orderRepo.findOne({ where: { notes: paymentIntentId } });
            if (orderDoc && orderDoc.status === 'PENDING' as any) {
                await this.orderRepo.remove(orderDoc);
                console.log(`[Stripe] Cancelled and removed PENDING Order ${orderDoc.id}`);
            }

            // Remove Payment if it exists and is PENDING
            const paymentDoc = await this.paymentRepo.findOne({ where: { stripeSessionId: paymentIntentId } });
            if (paymentDoc && paymentDoc.status === PaymentStatus.PENDING) {
                await this.paymentRepo.remove(paymentDoc);
                console.log(`[Stripe] Cancelled and removed PENDING Payment ${paymentDoc.id}`);
            }

            return { success: true };
        } catch (e) {
            console.error('[Stripe] Error cancelling payment intent', e);
            // Return gracefully
            return { success: false, message: e.message };
        }
    }

    async failPaymentIntent(clientSecret: string) {
        if (!this.stripe) return;
        try {
            const paymentIntentId = clientSecret.startsWith('pi_') && clientSecret.includes('_secret_')
                ? clientSecret.split('_secret_')[0]
                : clientSecret;

            const paymentDoc = await this.paymentRepo.findOne({ where: { stripeSessionId: paymentIntentId } });
            if (paymentDoc && paymentDoc.status === PaymentStatus.PENDING) {
                paymentDoc.status = PaymentStatus.FAILED;
                await this.paymentRepo.save(paymentDoc);
                console.log(`[Stripe] Marked Payment ${paymentDoc.id} as FAILED due to explicit frontend decline.`);
            }
            return { success: true };
        } catch (e) {
            console.error('[Stripe] Error marking payment intent as failed', e);
            return { success: false };
        }
    }

    // ─── Simulated Payment Flow ───────────────────────────────────────────────────

    async simulateEventPayment(dto: CreateEventCheckoutDto) {
        const event = await this.eventsService.findOne(dto.eventId);
        if (!event || !event.isActive) {
            throw new BadRequestException('El evento no está disponible.');
        }

        const price = Number(event.price);
        if (price <= 0) {
            throw new BadRequestException('Este evento es gratuito y no requiere pago.');
        }

        const simId = `simulated_event_${Date.now()}`;

        const payment = this.paymentRepo.create({
            amount: price,
            paymentMethod: PaymentMethod.STRIPE,
            status: PaymentStatus.COMPLETED,
            stripeSessionId: simId,
            description: `Simulated Event Checkout - ${event.title}`,
            user_id: dto.userId,
        });
        await this.paymentRepo.save(payment);

        const registration = await this.eventRegistrationsService.confirmPaidRegistration(dto.userId, dto.eventId);

        return {
            success: true,
            paymentId: payment.id,
            registrationId: registration.id,
            eventTitle: event.title,
            amount: price,
        };
    }

    async simulatePayment(dto: CreateCheckoutSessionDto) {
        let totalAmount = 0;
        const verifiedItems: any[] = [];

        for (const item of dto.items) {
            const productId = item.productId;
            if (!productId) {
                throw new BadRequestException(`productId requerido para item '${item.name}'`);
            }
            const product = await this.productRepo.findOne({ where: { id: productId } });
            if (!product) throw new BadRequestException(`Producto no encontrado: ID ${productId}`);
            if (product.stock < item.quantity) throw new BadRequestException(`Sin stock suficiente para '${product.name}'`);

            totalAmount += product.price * item.quantity;
            verifiedItems.push({
                ...item,
                price: product.price,
                name: product.name,
                productId: product.id,
            });
        }

        if (totalAmount > 0) totalAmount += 5; // Shipping fee

        const simId = `simulated_${Date.now()}`;

        const payment = this.paymentRepo.create({
            amount: totalAmount,
            paymentMethod: PaymentMethod.STRIPE, // Treat as Stripe for record keeping
            status: PaymentStatus.COMPLETED,
            stripeSessionId: simId,
            description: `Simulated Checkout – ${verifiedItems.length} item(s) + Envío`,
            user_id: dto.userId,
        });

        await this.paymentRepo.save(payment);

        const order = this.orderRepo.create({
            totalAmount,
            status: 'COMPLETED' as any,
            user_id: dto.userId,
            notes: simId,
        });
        await this.orderRepo.save(order);

        const orderItemsList = verifiedItems.map(item => {
            return this.orderItemRepo.create({
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: item.price * item.quantity,
            });
        });
        await this.orderItemRepo.save(orderItemsList);

        // Deduct stock for simulated purchase
        await this.deductStock(order.id);

        return { success: true, paymentId: payment.id, orderId: order.id };
    }
}
