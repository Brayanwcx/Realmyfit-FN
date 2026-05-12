import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '../dtos/product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product) private productRepo: Repository<Product>,
    ) {}

    async findAll() {
        return this.productRepo.find();
    }

    async findOne(id: number) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException(`Product #${id} not found`);
        }
        return product;
    }

    async create(dto: CreateProductDto) {
        const product = this.productRepo.create(dto);
        return this.productRepo.save(product);
    }

    async update(id: number, dto: UpdateProductDto) {
        const product = await this.findOne(id);
        this.productRepo.merge(product, dto);
        return this.productRepo.save(product);
    }

    async remove(id: number) {
        const product = await this.findOne(id);
        return this.productRepo.remove(product);
    }
}
