import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from '../dtos/payment.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new payment' })
    @ApiResponse({ status: 201, description: 'Payment created successfully' })
    create(@Body() dto: CreatePaymentDto) {
        return this.paymentsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all payments' })
    findAll() {
        return this.paymentsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get payment by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.paymentsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a payment by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) {
        return this.paymentsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a payment by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.paymentsService.remove(id);
    }
}

