import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TrainersService } from '../services/trainers.service';
import { CreateTrainerDto, UpdateTrainerDto } from '../dtos/trainer.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Trainers')
@Controller('trainers')
export class TrainersController {
    constructor(private readonly trainersService: TrainersService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new trainer' })
    @ApiResponse({ status: 201, description: 'Trainer created successfully' })
    create(@Body() dto: CreateTrainerDto) {
        return this.trainersService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all trainers' })
    findAll() {
        return this.trainersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get trainer by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.trainersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a trainer by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrainerDto) {
        return this.trainersService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a trainer by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.trainersService.remove(id);
    }
}

