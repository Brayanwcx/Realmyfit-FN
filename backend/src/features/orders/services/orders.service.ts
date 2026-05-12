import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CreateOrderDto, UpdateOrderDto } from '../dtos/order.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private orderRepo: Repository<Order>,
        @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    ) {}

    async findAll() {
        return this.orderRepo.find({ relations: ['user', 'items', 'items.product'] });
    }

    async findOne(id: number) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: ['user', 'items', 'items.product'],
        });
        if (!order) {
            throw new NotFoundException(`Order #${id} not found`);
        }
        return order;
    }

    async create(dto: CreateOrderDto) {
        const { items, ...orderData } = dto;

        // Calcular items con subtotal y totalAmount
        const orderItems = items.map((item) => {
            const subtotal = item.quantity * item.unitPrice;
            return this.orderItemRepo.create({ ...item, subtotal });
        });

        const totalAmount = orderItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

        const order = this.orderRepo.create({
            ...orderData,
            totalAmount,
            items: orderItems,
        });

        return this.orderRepo.save(order);
    }

    async update(id: number, dto: UpdateOrderDto) {
        const order = await this.findOne(id);
        const { items, ...orderData } = dto;

        if (items) {
            // Eliminar items anteriores
            await this.orderItemRepo.delete({ order_id: id });

            const orderItems = items.map((item) => {
                const subtotal = item.quantity * item.unitPrice;
                return this.orderItemRepo.create({ ...item, subtotal, order_id: id });
            });

            const totalAmount = orderItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
            order.items = orderItems;
            order.totalAmount = totalAmount;
        }

        this.orderRepo.merge(order, orderData);
        return this.orderRepo.save(order);
    }

    async remove(id: number) {
        const order = await this.findOne(id);
        return this.orderRepo.remove(order);
    }
}
