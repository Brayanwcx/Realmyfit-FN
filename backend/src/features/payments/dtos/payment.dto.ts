import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
    @IsNumber()
    @Min(0)
    @ApiProperty({ example: 99.99 })
    readonly amount: number;

    @IsEnum(PaymentMethod)
    @IsOptional()
    @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH, required: false })
    readonly paymentMethod?: PaymentMethod;

    @IsEnum(PaymentStatus)
    @IsOptional()
    @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING, required: false })
    readonly status?: PaymentStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'REF-001234', required: false })
    readonly reference?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Pago de membresía mensual', required: false })
    readonly description?: string;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID del usuario' })
    readonly user_id: number;
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
