import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesService } from '../services/roles.service';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';

@ApiBearerAuth()
@ApiTags('roles')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
    constructor(private rolesService: RolesService) {}

    @Get()
    getRoles() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    getRole(@Param('id', ParseIntPipe) id: number) {
        return this.rolesService.findOne(id);
    }

    @Post()
    createRole(@Body() payload: { name: string, description?: string }) {
        return this.rolesService.create(payload);
    }
}

