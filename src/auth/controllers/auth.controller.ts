import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/register.dto';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() payload: RegisterDto) {
        return this.authService.register(payload);
    }

    @Post('login')
    async login(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(
            body.email,
            body.password,
        );
        return this.authService.login(user);
    }
}
