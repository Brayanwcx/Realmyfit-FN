import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MachinesService } from '../services/machines.service';
import { CreateMachineDto, UpdateMachineDto } from '../dtos/machine.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Machines')
@Controller('machines')
export class MachinesController {
    constructor(private readonly machinesService: MachinesService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new machine' })
    @ApiResponse({ status: 201, description: 'Machine created successfully' })
    create(@Body() dto: CreateMachineDto) {
        return this.machinesService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all machines' })
    findAll() {
        return this.machinesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get machine by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.machinesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a machine by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMachineDto) {
        return this.machinesService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a machine by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.machinesService.remove(id);
    }
}

