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
}
