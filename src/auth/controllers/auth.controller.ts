import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users/users.service';
import { CreateUserDto } from '../../users/dtos/user.dto';

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
}
