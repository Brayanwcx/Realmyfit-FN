import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus } from '../entities/order.entity';

export class CreateOrderItemDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID del producto' })
    readonly product_id: number;

    @IsNumber()
    @Min(1)
    @ApiProperty({ example: 2 })
    readonly quantity: number;

    @IsNumber()
    @Min(0)
    @ApiProperty({ example: 49.99 })
    readonly unitPrice: number;
}

export class CreateOrderDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID del usuario' })
    readonly user_id: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Calle 123 #45-67', required: false })
    readonly shippingAddress?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Entregar en recepción', required: false })
    readonly notes?: string;

    @IsEnum(OrderStatus)
    @IsOptional()
    @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING, required: false })
    readonly status?: OrderStatus;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    @ApiProperty({ type: [CreateOrderItemDto] })
    readonly items: CreateOrderItemDto[];
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
