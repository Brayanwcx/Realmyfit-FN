import { Body, Controller, Get, Post, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../features/users/services/users/users.service';
import { CreateUserDto } from '../../features/users/dtos/user.dto';
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

    @UseGuards(JwtAuthGuard)
    @Post('profile/avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads/avatars';
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                cb(null, `avatar-${uniqueSuffix}${ext}`);
            }
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                return cb(new BadRequestException('Only image files are allowed!'), false);
            }
            cb(null, true);
        }
    }))
    async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        
        const userId = req.user.sub || req.user.id;
        const profilePictureUrl = `http://localhost:3005/uploads/avatars/${file.filename}`;
        
        // Update user profile
        await this.usersService.updateUser(userId, { profilePicture: profilePictureUrl });
        
        return {
            message: 'Profile picture updated successfully',
            profilePicture: profilePictureUrl
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile/wishlist')
    async getWishlist(@Req() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.usersService.getWishlist(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('profile/wishlist/:productId')
    async addToWishlist(@Req() req: any, @Param('productId') productId: string) {
        const userId = req.user.sub || req.user.id;
        return this.usersService.addToWishlist(userId, parseInt(productId, 10));
    }

    @UseGuards(JwtAuthGuard)
    @Delete('profile/wishlist/:productId')
    async removeFromWishlist(@Req() req: any, @Param('productId') productId: string) {
        const userId = req.user.sub || req.user.id;
        return this.usersService.removeFromWishlist(userId, parseInt(productId, 10));
    }
}
