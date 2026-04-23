import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users/users.service';
import { CreateUserDto } from '../../users/dtos/user.dto';
import { JwtAuthGuard } from '../guards/auth.guard';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) {}

    @Post('login')
    async login(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(
            body.email,
            body.password,
        );
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() body: CreateUserDto) {
        return this.usersService.create(body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Req() req: any) {
        const userId = req.user.sub || req.user.id;
        const user = await this.usersService.findOne(userId);
        // Remove password from response
        const { password, ...result } = user;
        return result;
    }
}
