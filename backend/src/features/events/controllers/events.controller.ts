import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from '../services/events.service';
import { CreateEventDto, UpdateEventDto } from '../dtos/event.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Events')
@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 201, description: 'Event created successfully' })
    create(@Body() dto: CreateEventDto) {
        return this.eventsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all events' })
    findAll() {
        return this.eventsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get event by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an event by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto) {
        return this.eventsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete an event by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.remove(id);
    }
}

