import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentMethod, PaymentStatus } from '../entities/payment.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Product } from '../../products/entities/product.entity';
import { CreatePaymentDto, UpdatePaymentDto, CreateCheckoutSessionDto } from '../dtos/payment.dto';

@Injectable()
export class PaymentsService {
    private stripe: any;

    constructor(
        @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
        @InjectRepository(Order) private orderRepo: Repository<Order>,
        @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        private configService: ConfigService,
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

    async createCheckoutSession(dto: CreateCheckoutSessionDto) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
        const successUrl = dto.successUrl || `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = dto.cancelUrl || `${frontendUrl}/checkout/cancel`;

        const lineItems: any[] = dto.items.map((item) => ({
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

        // Persist a PENDING payment record
        const totalAmount = dto.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // Create Payment record
        const payment = this.paymentRepo.create({
            amount: totalAmount,
            paymentMethod: PaymentMethod.STRIPE,
            status: PaymentStatus.PENDING,
            stripeSessionId: session.id,
            description: `Stripe Checkout – ${dto.items.length} item(s)`,
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
        const orderItemsList = dto.items.map(item => this.orderItemRepo.create({
            order_id: order.id,
            product_id: item.productId || 1, // Fallback if missing
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
        }));
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
            
            const orderDoc = await this.orderRepo.findOne({ where: { notes: session.id } });
            if (orderDoc) {
                await this.orderRepo.update(
                    { id: orderDoc.id },
                    { status: 'CONFIRMED' as any },
                );
                await this.deductStock(orderDoc.id);
            }
            console.log(`[Stripe] Payment completed for session ${session.id}`);
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

    async simulatePayment(dto: CreateCheckoutSessionDto) {
        const totalAmount = dto.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const simId = `simulated_${Date.now()}`;

        const payment = this.paymentRepo.create({
            amount: totalAmount,
            paymentMethod: PaymentMethod.STRIPE, // Treat as Stripe for record keeping
            status: PaymentStatus.COMPLETED,
            stripeSessionId: simId,
            description: `Simulated Checkout – ${dto.items.length} item(s)`,
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

        const orderItemsList = dto.items.map(item => this.orderItemRepo.create({
            order_id: order.id,
            product_id: item.productId || 1,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
        }));
        await this.orderItemRepo.save(orderItemsList);

        // Deduct stock for simulated purchase
        await this.deductStock(order.id);

        return { success: true, paymentId: payment.id, orderId: order.id };
    }
}
