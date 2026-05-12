import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from '../services/contacts.service';
import { CreateContactDto, UpdateContactDto } from '../dtos/contact.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) {}

    // POST público (formulario de contacto, sin auth)
    @Post()
    @ApiOperation({ summary: 'Send a contact message (public)' })
    @ApiResponse({ status: 201, description: 'Contact message sent successfully' })
    create(@Body() dto: CreateContactDto) {
        return this.contactsService.create(dto);
    }

    // Los siguientes endpoints requieren auth (admin)
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    @ApiOperation({ summary: 'Get all contact messages (admin)' })
    findAll() {
        return this.contactsService.findAll();
    }

    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Get contact message by id (admin)' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.contactsService.findOne(id);
    }

    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a contact message by id (admin)' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContactDto) {
        return this.contactsService.update(id, dto);
    }

    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a contact message by id (admin)' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.contactsService.remove(id);
    }
}

