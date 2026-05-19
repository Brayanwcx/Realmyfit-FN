import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Proteína Whey' })
    readonly name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Proteína de suero de alta calidad', required: false })
    readonly description?: string;

    @IsNumber()
    @Min(0)
    @ApiProperty({ example: 49.99 })
    readonly price: number;

    @IsNumber()
    @Min(0)
    @ApiProperty({ example: 100 })
    readonly stock: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
    readonly imageUrl?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Suplementos', required: false })
    readonly category?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true, required: false })
    readonly isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
