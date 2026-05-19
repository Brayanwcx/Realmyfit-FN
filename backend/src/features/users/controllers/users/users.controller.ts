import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/models/roles.model';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from '../../dtos/user.dto';
import { UsersService } from '../../services/users/users.service';
import { JwtAuthGuard } from '../../../../auth/guards/auth.guard';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {

    constructor(private usersService: UsersService){}

    @Get()
    getUsers() {
        return this.usersService.findAll();
    }

    @Get(':userId')
    getOne(@Param('userId', ParseIntPipe) userId: number){
        return this.usersService.findOne(userId);
    }

    @Post()
    createUser(@Body() payload: CreateUserDto){
        return this.usersService.create(payload);
    }

    @Put(':userId')
    updateUser(@Param('userId', ParseIntPipe) userId: number, @Body() payloadUpdated: UpdateUserDto){
        return this.usersService.updateUser(userId, payloadUpdated);
    }

    @Delete(':userId')
    deleteUser(@Param('userId', ParseIntPipe) userId: number){
        this.usersService.deleteUser(userId);
    }

}

