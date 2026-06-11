import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsArray, ValidateNested, Min, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

// ─── Admin CRUD DTOs ─────────────────────────────────────────────────────────

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

// ─── Stripe Checkout DTOs ─────────────────────────────────────────────────────

export class CheckoutItemDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Proteína Whey' })
    readonly name: string;

    @IsNumber()
    @Min(0)
    @ApiProperty({ example: 29.99 })
    readonly price: number;

    @IsNumber()
    @Min(1)
    @ApiProperty({ example: 2 })
    readonly quantity: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'https://...', required: false })
    readonly image?: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 1, required: false })
    readonly productId?: number;
}

export class CreateCheckoutSessionDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CheckoutItemDto)
    @ApiProperty({ type: [CheckoutItemDto] })
    readonly items: CheckoutItemDto[];

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1 })
    readonly userId: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    readonly successUrl?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    readonly cancelUrl?: string;
}

export class CreateEventCheckoutDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID del evento a comprar' })
    readonly eventId: number;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1 })
    readonly userId: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    readonly successUrl?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    readonly cancelUrl?: string;
}

export class CreateMembershipCheckoutDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID of the Membership plan to purchase' })
    readonly membershipId: number;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1 })
    readonly userId: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    readonly successUrl?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    readonly cancelUrl?: string;
}
