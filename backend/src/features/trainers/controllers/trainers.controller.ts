import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards,
    UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { TrainersService } from '../services/trainers.service';
import { CreateTrainerDto, UpdateTrainerDto } from '../dtos/trainer.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

const uploadsDir = join(process.cwd(), 'uploads', 'trainers');

@ApiTags('Trainers')
@Controller('trainers')
export class TrainersController {
    constructor(private readonly trainersService: TrainersService) {}

    // ── Rutas públicas (sin autenticación) ──────────────────────────────────

    @Get()
    @ApiOperation({ summary: 'Get all trainers (public)' })
    findAll() {
        return this.trainersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get trainer by id (public)' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.trainersService.findOne(id);
    }

    // ── Rutas protegidas (solo ADMIN) ───────────────────────────────────────

    @Post()
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Create a new trainer' })
    @ApiResponse({ status: 201, description: 'Trainer created successfully' })
    create(@Body() dto: CreateTrainerDto) {
        return this.trainersService.create(dto);
    }

    @Post('upload-image')
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Upload trainer profile image' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (_req, _file, cb) => {
                    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
                    cb(null, uploadsDir);
                },
                filename: (_req, file, cb) => {
                    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    cb(null, `trainer-${unique}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
                    return cb(new BadRequestException('Solo se permiten imágenes (jpg, jpeg, png, webp, gif)'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 5 * 1024 * 1024 },
        }),
    )
    uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo.');
        return { imageUrl: `/uploads/trainers/${file.filename}` };
    }

    @Patch(':id')
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update a trainer by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrainerDto) {
        return this.trainersService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a trainer by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.trainersService.remove(id);
    }
}
