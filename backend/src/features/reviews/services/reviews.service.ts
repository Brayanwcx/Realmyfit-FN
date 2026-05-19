import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { CreateReviewDto, UpdateReviewDto } from '../dtos/review.dto';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review) private reviewRepo: Repository<Review>,
    ) {}

    async findAll() {
        return this.reviewRepo.find({ relations: ['user'] });
    }

    async findOne(id: number) {
        const review = await this.reviewRepo.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!review) {
            throw new NotFoundException(`Review #${id} not found`);
        }
        return review;
    }

    async create(dto: CreateReviewDto) {
        const review = this.reviewRepo.create(dto);
        return this.reviewRepo.save(review);
    }

    async update(id: number, dto: UpdateReviewDto) {
        const review = await this.findOne(id);
        this.reviewRepo.merge(review, dto);
        return this.reviewRepo.save(review);
    }

    async remove(id: number) {
        const review = await this.findOne(id);
        return this.reviewRepo.remove(review);
    }
}
