import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';
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
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
