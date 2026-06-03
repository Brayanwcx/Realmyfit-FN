import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventRegistrationsService } from '../services/event-registrations.service';
import { CreateEventRegistrationDto, UpdateEventRegistrationDto } from '../dtos/event-registration.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiTags('Event Registrations')
@Controller('event-registrations')
export class EventRegistrationsController {
    constructor(private readonly regService: EventRegistrationsService) {}

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Register a user to an event (any authenticated user)' })
    @ApiResponse({ status: 201, description: 'Registration created successfully' })
    create(@Body() dto: CreateEventRegistrationDto) {
        return this.regService.create(dto);
    }

    @Get()
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get all event registrations' })
    findAll() {
        return this.regService.findAll();
    }

    @Get(':id')
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get event registration by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.regService.findOne(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update an event registration by id (admin only)' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventRegistrationDto) {
        return this.regService.update(id, dto);
    }

    @Patch(':id/cancel')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Cancel own event registration (any authenticated user)' })
    cancelOwn(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        const userId = req.user?.id || req.user?.sub;
        return this.regService.cancelOwn(id, userId);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete an event registration by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.regService.remove(id);
    }
}
