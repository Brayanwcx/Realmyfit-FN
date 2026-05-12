import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Maratón de Spinning' })
    readonly title: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Evento de spinning de 2 horas', required: false })
    readonly description?: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: '2026-04-15' })
    readonly date: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '10:00', required: false })
    readonly time?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Sala principal', required: false })
    readonly location?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    @ApiProperty({ example: 30, required: false })
    readonly capacity?: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'https://example.com/event.jpg', required: false })
    readonly imageUrl?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true, required: false })
    readonly isActive?: boolean;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
