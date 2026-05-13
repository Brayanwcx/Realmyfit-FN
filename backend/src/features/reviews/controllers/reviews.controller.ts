import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto, UpdateReviewDto } from '../dtos/review.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create a new review' })
    @ApiResponse({ status: 201, description: 'Review created successfully' })
    create(@Body() dto: CreateReviewDto) {
        return this.reviewsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all reviews' })
    findAll() {
        return this.reviewsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get review by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.reviewsService.findOne(id);
    }

    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Patch(':id')
    @ApiOperation({ summary: 'Update a review by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewDto) {
        return this.reviewsService.update(id, dto);
    }

    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a review by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.reviewsService.remove(id);
    }
}

