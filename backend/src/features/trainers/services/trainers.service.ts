import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from '../entities/trainer.entity';
import { CreateTrainerDto, UpdateTrainerDto } from '../dtos/trainer.dto';

@Injectable()
export class TrainersService {
    constructor(
        @InjectRepository(Trainer) private trainerRepo: Repository<Trainer>,
    ) {}

    async findAll() {
        return this.trainerRepo.find();
    }

    async findOne(id: number) {
        const trainer = await this.trainerRepo.findOne({ where: { id } });
        if (!trainer) {
            throw new NotFoundException(`Trainer #${id} not found`);
        }
        return trainer;
    }

    async create(dto: CreateTrainerDto) {
        const trainer = this.trainerRepo.create(dto);
        return this.trainerRepo.save(trainer);
    }

    async update(id: number, dto: UpdateTrainerDto) {
        const trainer = await this.findOne(id);
        this.trainerRepo.merge(trainer, dto);
        return this.trainerRepo.save(trainer);
    }

    async remove(id: number) {
        const trainer = await this.findOne(id);
        return this.trainerRepo.remove(trainer);
    }
}
