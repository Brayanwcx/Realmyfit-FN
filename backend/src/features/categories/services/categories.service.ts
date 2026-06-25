import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
    ) {}

    findAll() {
        return this.categoryRepo.find();
    }

    async findOne(id: number) {
        const category = await this.categoryRepo.findOne({ where: { id } });
        if (!category) throw new NotFoundException(`Categoria #${id} no encontrada`);
        return category;
    }

    async create(data: CreateCategoryDto) {
        const exists = await this.categoryRepo.findOne({ where: { name: data.name } });
        if (exists) throw new BadRequestException(`La categoría ${data.name} ya existe`);
        
        const newCategory = this.categoryRepo.create(data);
        return this.categoryRepo.save(newCategory);
    }

    async update(id: number, changes: UpdateCategoryDto) {
        const category = await this.findOne(id);
        this.categoryRepo.merge(category, changes);
        return this.categoryRepo.save(category);
    }

    async remove(id: number) {
        const category = await this.findOne(id);
        return this.categoryRepo.remove(category);
    }
}
