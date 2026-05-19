import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';

export class CreateTrainerDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Carlos' })
    readonly name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Martínez' })
    readonly lastName: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'carlos@gym.com', required: false })
    readonly email?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '3009876543', required: false })
    readonly phone?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'CrossFit, Funcional', required: false })
    readonly specialty?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '5 años', required: false })
    readonly experience?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'https://example.com/trainer.jpg', required: false })
    readonly imageUrl?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true, required: false })
    readonly isActive?: boolean;
}

export class UpdateTrainerDto extends PartialType(CreateTrainerDto) {}
