import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards, Req, Headers, BadRequestException, RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto, UpdatePaymentDto, CreateCheckoutSessionDto, CreateMembershipCheckoutDto, CreateEventCheckoutDto } from '../dtos/payment.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    // ─── STRIPE ENDPOINTS ────────────────────────────────────────────────────────

    /** Creates a Stripe PaymentIntent and returns the clientSecret. Requires JWT. */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('stripe/payment-intent')
    @ApiOperation({ summary: 'Create a Stripe PaymentIntent' })
    @ApiResponse({ status: 201, description: 'Returns { clientSecret }' })
    createPaymentIntent(@Body() dto: CreateCheckoutSessionDto) {
        return this.paymentsService.createPaymentIntent(dto);
    }

    /** Creates a Stripe PaymentIntent specifically for Memberships */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('stripe/payment-intent/membership')
    @ApiOperation({ summary: 'Create a Stripe PaymentIntent for Memberships' })
    @ApiResponse({ status: 201, description: 'Returns { clientSecret }' })
    createMembershipPaymentIntent(@Body() dto: CreateMembershipCheckoutDto) {
        return this.paymentsService.createMembershipPaymentIntent(dto);
    }

    /** Creates a Stripe PaymentIntent specifically for Events */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('stripe/payment-intent/event')
    @ApiOperation({ summary: 'Create a Stripe PaymentIntent for Events' })
    @ApiResponse({ status: 201, description: 'Returns { clientSecret }' })
    createEventPaymentIntent(@Body() dto: CreateEventCheckoutDto) {
        return this.paymentsService.createEventPaymentIntent(dto);
    }

    /** Stripe webhook – public endpoint (no JWT) so Stripe can POST freely. */
    @Post('stripe/webhook')
    @ApiOperation({ summary: 'Stripe Webhook Endpoint (Public)' })
    @ApiResponse({ status: 200, description: 'Webhook processed' })
    async stripeWebhook(@Req() request: any, @Headers('stripe-signature') signature: string) {
        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }
        await this.paymentsService.handleWebhookEvent(request.rawBody as Buffer, signature);
        return { received: true };
    }

    /** Permite al frontend validar una orden desde la pantalla de éxito por si no llega el Webhook */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('stripe/verify/:clientSecret')
    @ApiOperation({ summary: 'Verify a Stripe PaymentIntent manually' })
    verifyPaymentIntent(@Param('clientSecret') clientSecret: string) {
        return this.paymentsService.verifyPaymentIntent(clientSecret);
    }

    // ─── Simulated Checkout ──────────────────────────────────────────

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('simulate')
    @ApiOperation({ summary: 'Simulate a successful payment without Stripe' })
    simulatePayment(@Body() dto: CreateCheckoutSessionDto) {
        return this.paymentsService.simulatePayment(dto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('simulate/event')
    @ApiOperation({ summary: 'Simulate a successful event payment without Stripe' })
    simulateEventPayment(@Body() dto: CreateEventCheckoutDto) {
        return this.paymentsService.simulateEventPayment(dto);
    }

    // ─── ADMIN CRUD ──────────────────────────────────────────────────────────────

    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @ApiOperation({ summary: 'Create a payment record (admin)' })
    @ApiResponse({ status: 201, description: 'Payment created successfully' })
    create(@Body() dto: CreatePaymentDto) {
        return this.paymentsService.create(dto);
    }

    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    @ApiOperation({ summary: 'Get all payments (admin)' })
    findAll() {
        return this.paymentsService.findAll();
    }

    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Get payment by id (admin)' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.paymentsService.findOne(id);
    }

    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a payment (admin)' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) {
        return this.paymentsService.update(id, dto);
    }

    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id/refunded')
    @ApiOperation({ summary: 'Mark a PENDING_REFUND payment as REFUNDED (admin)' })
    markAsRefunded(@Param('id', ParseIntPipe) id: number) {
        return this.paymentsService.markAsRefunded(id);
    }

    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a payment (admin)' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.paymentsService.remove(id);
    }
}
