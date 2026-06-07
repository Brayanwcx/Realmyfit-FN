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

    async createEventCheckoutSession(dto: CreateEventCheckoutDto) {
        if (!this.stripe) throw new BadRequestException('Stripe not configured.');

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
        const successUrl = dto.successUrl || `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = dto.cancelUrl || `${frontendUrl}/checkout/cancel`;

        const event = await this.eventsService.findOne(dto.eventId);
        if (!event || !event.isActive) {
            throw new BadRequestException('El evento no está disponible.');
        }
        const price = Number(event.price);
        if (price <= 0) {
            throw new BadRequestException('Este evento es gratuito y no requiere pago.');
        }

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: Math.round(price * 100),
                    product_data: { name: `Evento: ${event.title}` },
                },
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
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
            stripeSessionId: session.id,
            description: `Evento Checkout - ${event.title}`,
            user_id: dto.userId,
        });
        await this.paymentRepo.save(payment);

        return { url: session.url, sessionId: session.id };
    }

    async createMembershipCheckoutSession(dto: CreateMembershipCheckoutDto) {
        if (!this.stripe) throw new BadRequestException('Stripe not configured.');

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
        const successUrl = dto.successUrl || `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = dto.cancelUrl || `${frontendUrl}/checkout/cancel`;

        const membership = await this.membershipsService.findOne(dto.membershipId);
        if (!membership || !membership.isActive) {
            throw new BadRequestException('Membership is not available');
        }

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: Math.round(membership.price * 100),
                    product_data: { name: `Membresía: ${membership.name}` },
                },
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
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
            stripeSessionId: session.id,
            description: `Membresía Checkout - ${membership.name}`,
            user_id: dto.userId,
        });
        await this.paymentRepo.save(payment);

        return { url: session.url, sessionId: session.id };
    }

    async createCheckoutSession(dto: CreateCheckoutSessionDto) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
        const successUrl = dto.successUrl || `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = dto.cancelUrl || `${frontendUrl}/checkout/cancel`;

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

        const lineItems: any[] = verifiedItems.map((item) => ({
            quantity: item.quantity,
            price_data: {
                currency: 'usd',
                unit_amount: Math.round(item.price * 100), // Stripe uses cents
                product_data: {
                    name: item.name,
                    ...(item.image && item.image.startsWith('http') ? { images: [item.image] } : {}),
                },
            },
        }));

        if (totalAmount > 0) {
            // Add Shipping Fee
            totalAmount += 5;
            lineItems.push({
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: 500, // $5.00
                    product_data: {
                        name: 'Tarifa de Envío',
                    },
                },
            });
        }


        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId: String(dto.userId),
            },
        });

        // Create Payment record
        const payment = this.paymentRepo.create({
            amount: totalAmount,
            paymentMethod: PaymentMethod.STRIPE,
            status: PaymentStatus.PENDING,
            stripeSessionId: session.id,
            description: `Stripe Checkout – ${verifiedItems.length} item(s) + Envío`,
            user_id: dto.userId,
        });
        await this.paymentRepo.save(payment);

        // Create Order record linked to the Stripe Session ID in 'notes'
        const order = this.orderRepo.create({
            totalAmount,
            status: 'PENDING' as any,
            user_id: dto.userId,
            notes: session.id,
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

        return { url: session.url, sessionId: session.id };
    }

    async verifyCheckoutSession(sessionId: string) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe is not configured.');
        }

        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            
            // Si el pago ya fue procesado correctamente:
            if (session.payment_status === 'paid') {
                if (session.metadata?.type === 'MEMBERSHIP') {
                    const paymentDoc = await this.paymentRepo.findOne({ where: { stripeSessionId: session.id } });
                    if (paymentDoc && paymentDoc.status !== PaymentStatus.COMPLETED) {
                        await this.paymentRepo.update({ id: paymentDoc.id }, { status: PaymentStatus.COMPLETED });
                        await this.membershipsService.subscribeUser(Number(session.metadata.userId), Number(session.metadata.membershipId));
                        return { success: true, status: 'paid', type: 'membership' };
                    }
                    return { success: true, status: 'already_processed', type: 'membership' };
                }

                if (session.metadata?.type === 'EVENT') {
                    const paymentDoc = await this.paymentRepo.findOne({ where: { stripeSessionId: session.id } });
                    if (paymentDoc && paymentDoc.status !== PaymentStatus.COMPLETED) {
                        await this.paymentRepo.update({ id: paymentDoc.id }, { status: PaymentStatus.COMPLETED });
                        await this.eventRegistrationsService.confirmPaidRegistration(
                            Number(session.metadata.userId),
                            Number(session.metadata.eventId),
                        );
                        return { success: true, status: 'paid', type: 'event', eventId: Number(session.metadata.eventId) };
                    }
                    return { success: true, status: 'already_processed', type: 'event', eventId: Number(session.metadata.eventId) };
                }

                const orderDoc = await this.orderRepo.findOne({ where: { notes: session.id } });
                
                // Solo si encontramos la orden y aun esta pendiente para evitar restar multiple veces
                if (orderDoc && orderDoc.status !== 'CONFIRMED' as any) {
                    await this.paymentRepo.update(
                        { stripeSessionId: session.id },
                        { status: PaymentStatus.COMPLETED },
                    );

                    await this.orderRepo.update(
                        { id: orderDoc.id },
                        { status: 'CONFIRMED' as any },
                    );
                    
                    // Disminuir Stock
                    await this.deductStock(orderDoc.id);
                    
                    return { success: true, status: 'paid', orderId: orderDoc.id };
                }
                return { success: true, status: 'already_processed', orderId: orderDoc?.id };
            }
            
            return { success: false, status: session.payment_status };
        } catch (err) {
            throw new BadRequestException(`Could not verify Stripe session: ${err.message}`);
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

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any;
            await this.paymentRepo.update(
                { stripeSessionId: session.id },
                { status: PaymentStatus.COMPLETED },
            );
            
            if (session.metadata?.type === 'MEMBERSHIP') {
                try {
                    await this.membershipsService.subscribeUser(Number(session.metadata.userId), Number(session.metadata.membershipId));
                    console.log(`[Stripe] Membership activated for session ${session.id}`);
                } catch (e) {
                    console.error('[Stripe] Failed to assign membership on webhook:', e);
                }
            } else if (session.metadata?.type === 'EVENT') {
                try {
                    await this.eventRegistrationsService.confirmPaidRegistration(
                        Number(session.metadata.userId),
                        Number(session.metadata.eventId),
                    );
                    console.log(`[Stripe] Event registration confirmed for session ${session.id}`);
                } catch (e) {
                    console.error('[Stripe] Failed to confirm event registration on webhook:', e);
                }
            } else {
                const orderDoc = await this.orderRepo.findOne({ where: { notes: session.id } });
                if (orderDoc) {
                    // Bug #6 fix: verificar que la orden no fue ya confirmada antes de deducir stock
                    // (puede ocurrir si verifyCheckoutSession() se ejecutó antes que el webhook)
                    if (orderDoc.status !== 'CONFIRMED' as any) {
                        await this.orderRepo.update(
                            { id: orderDoc.id },
                            { status: 'CONFIRMED' as any },
                        );
                        await this.deductStock(orderDoc.id);
                    }
                }
                console.log(`[Stripe] Payment completed for session ${session.id}`);
            }
        }

        if (event.type === 'checkout.session.expired') {
            const session = event.data.object as any;
            await this.paymentRepo.update(
                { stripeSessionId: session.id },
                { status: PaymentStatus.FAILED },
            );
            await this.orderRepo.update(
                { notes: session.id },
                { status: 'CANCELLED' as any },
            );
        }

        return { received: true };
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
