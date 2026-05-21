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
import { MachinesService } from '../services/machines.service';
import { CreateMachineDto, UpdateMachineDto } from '../dtos/machine.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

const uploadsDir = join(process.cwd(), 'uploads', 'machines');

@ApiTags('Machines')
@Controller('machines')
export class MachinesController {
    constructor(private readonly machinesService: MachinesService) {}

    @Post()
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Create a new machine' })
    @ApiResponse({ status: 201, description: 'Machine created successfully' })
    create(@Body() dto: CreateMachineDto) {
        return this.machinesService.create(dto);
    }

    @Post('upload-image')
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Upload machine image' })
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
                    cb(null, `machine-${unique}${extname(file.originalname)}`);
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
        return { imageUrl: `/uploads/machines/${file.filename}` };
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
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update a machine by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMachineDto) {
        return this.machinesService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a machine by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.machinesService.remove(id);
    }
}
