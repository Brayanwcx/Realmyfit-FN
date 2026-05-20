import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { CreatePaymentDto, UpdatePaymentDto } from '../dtos/payment.dto';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    ) {}

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

    async getMonthlyRevenue() {
        const payments = await this.paymentRepo.find();
        const monthlyRevenue: { [key: string]: number } = {};

        // Inicializar los últimos 6 meses con 0
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const currentYear = new Date().getFullYear();

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
            monthlyRevenue[monthKey] = 0;
        }

        // Sumar los pagos por mes
        payments.forEach(payment => {
            if (payment.amount && payment.createdAt) {
                const paymentDate = new Date(payment.createdAt);
                const monthKey = `${months[paymentDate.getMonth()]} ${paymentDate.getFullYear()}`;
                if (monthlyRevenue.hasOwnProperty(monthKey)) {
                    monthlyRevenue[monthKey] += Number(payment.amount);
                }
            }
        });

        return {
            labels: Object.keys(monthlyRevenue),
            data: Object.values(monthlyRevenue)
        };
    }
}
