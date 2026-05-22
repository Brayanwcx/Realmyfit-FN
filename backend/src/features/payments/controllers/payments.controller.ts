import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards, Req, Headers, BadRequestException, RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto, UpdatePaymentDto, CreateCheckoutSessionDto, CreateMembershipCheckoutDto } from '../dtos/payment.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    // ─── STRIPE ENDPOINTS ────────────────────────────────────────────────────────

    /** Creates a Stripe Checkout session and returns the redirect URL. Requires JWT. */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('stripe/checkout-session')
    @ApiOperation({ summary: 'Create a Stripe Checkout session' })
    @ApiResponse({ status: 201, description: 'Returns { url, sessionId }' })
    createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
        return this.paymentsService.createCheckoutSession(dto);
    }

    /** Creates a Stripe Checkout session specifically for Memberships */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('stripe/checkout-session/membership')
    @ApiOperation({ summary: 'Create a Stripe Checkout session for Memberships' })
    @ApiResponse({ status: 201, description: 'Returns { url, sessionId }' })
    createMembershipCheckoutSession(@Body() dto: CreateMembershipCheckoutDto) {
        return this.paymentsService.createMembershipCheckoutSession(dto);
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
    @Get('stripe/verify-session/:sessionId')
    @ApiOperation({ summary: 'Verify a Stripe Session manually' })
    verifySession(@Param('sessionId') sessionId: string) {
        return this.paymentsService.verifyCheckoutSession(sessionId);
    }

    // ─── Simulated Checkout ──────────────────────────────────────────

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('simulate')
    @ApiOperation({ summary: 'Simulate a successful payment without Stripe' })
    simulatePayment(@Body() dto: CreateCheckoutSessionDto) {
        return this.paymentsService.simulatePayment(dto);
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
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a payment (admin)' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.paymentsService.remove(id);
    }
}
