import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipsService } from '../services/memberships.service';
import { CreateMembershipDto, UpdateMembershipDto, CreateUserMembershipDto, UpdateUserMembershipDto } from '../dtos/membership.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

// --- Public Endpoints (no admin guard, registered FIRST to avoid route conflicts) ---
@ApiTags('Memberships - Public')
@Controller('public/memberships')
export class PublicMembershipsController {
    constructor(private readonly membershipsService: MembershipsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all active membership plans (public)' })
    findAllActive() {
        return this.membershipsService.findAllActive();
    }

    @Post('subscribe')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Subscribe current user to a membership plan' })
    @ApiResponse({ status: 201, description: 'Subscribed successfully' })
    subscribe(@Req() req: any, @Body('membershipId', ParseIntPipe) membershipId: number) {
        const userId = req.user.id || req.user.sub;
        return this.membershipsService.subscribeUser(userId, membershipId);
    }
}

// --- Admin CRUD (requires ADMIN role) ---
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Memberships')
@Controller('memberships')
export class MembershipsController {
    constructor(private readonly membershipsService: MembershipsService) {}

    // --- Membership Plans ---
    @Post()
    @ApiOperation({ summary: 'Create a new membership plan' })
    @ApiResponse({ status: 201, description: 'Membership created successfully' })
    create(@Body() dto: CreateMembershipDto) {
        return this.membershipsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all membership plans' })
    findAll() {
        return this.membershipsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get membership plan by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.membershipsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a membership plan by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMembershipDto) {
        return this.membershipsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a membership plan by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.membershipsService.remove(id);
    }

    // --- User Memberships (subscriptions) ---
    @Post('subscriptions')
    @ApiOperation({ summary: 'Subscribe a user to a membership' })
    @ApiResponse({ status: 201, description: 'Subscription created successfully' })
    createSubscription(@Body() dto: CreateUserMembershipDto) {
        return this.membershipsService.createUserMembership(dto);
    }

    @Get('subscriptions/all')
    @ApiOperation({ summary: 'Get all user subscriptions' })
    findAllSubscriptions() {
        return this.membershipsService.findAllUserMemberships();
    }

    @Get('subscriptions/:id')
    @ApiOperation({ summary: 'Get user subscription by id' })
    findOneSubscription(@Param('id', ParseIntPipe) id: number) {
        return this.membershipsService.findOneUserMembership(id);
    }

    @Patch('subscriptions/:id')
    @ApiOperation({ summary: 'Update a user subscription by id' })
    updateSubscription(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserMembershipDto) {
        return this.membershipsService.updateUserMembership(id, dto);
    }

    @Delete('subscriptions/:id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a user subscription by id' })
    removeSubscription(@Param('id', ParseIntPipe) id: number) {
        return this.membershipsService.removeUserMembership(id);
    }
}

