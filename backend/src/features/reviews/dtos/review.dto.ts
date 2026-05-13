import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    @ApiProperty({ example: 5, description: 'Rating del 1 al 5' })
    readonly rating: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Excelente gimnasio, muy limpio y organizado', required: false })
    readonly comment?: string;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID del usuario' })
    readonly user_id: number;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true, description: 'Estado de la reseña', required: false })
    readonly isActive?: boolean;
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
