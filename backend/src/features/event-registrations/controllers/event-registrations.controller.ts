import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventRegistrationsService } from '../services/event-registrations.service';
import { CreateEventRegistrationDto, UpdateEventRegistrationDto } from '../dtos/event-registration.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Event Registrations')
@Controller('event-registrations')
export class EventRegistrationsController {
    constructor(private readonly regService: EventRegistrationsService) {}

    @Post()
    @ApiOperation({ summary: 'Register a user to an event' })
    @ApiResponse({ status: 201, description: 'Registration created successfully' })
    create(@Body() dto: CreateEventRegistrationDto) {
        return this.regService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all event registrations' })
    findAll() {
        return this.regService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get event registration by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.regService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an event registration by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventRegistrationDto) {
        return this.regService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete an event registration by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.regService.remove(id);
    }
}

