import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, HttpCode, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto, UpdateProductDto } from '../dtos/product.dto';
import { JwtAuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/models/roles.model';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Post()
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Create a new product' })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    create(@Body() dto: CreateProductDto) {
        return this.productsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all products' })
    findAll() {
        return this.productsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update a product by id' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
        return this.productsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiBearerAuth()
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Delete a product by id' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.remove(id);
    }
}

