import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { MachineStatus } from '../entities/machine.entity';

export class CreateMachineDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Caminadora Pro X500' })
    readonly name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Caminadora profesional con inclinación automática', required: false })
    readonly description?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'NordicTrack', required: false })
    readonly brand?: string;


    @IsEnum(MachineStatus)
    @IsOptional()
    @ApiProperty({ enum: MachineStatus, example: MachineStatus.AVAILABLE, required: false })
    readonly status?: MachineStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'https://example.com/machine.jpg', required: false })
    readonly imageUrl?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '2025-01-15', required: false })
    readonly acquisitionDate?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Fuerza', required: false })
    readonly category?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'https://youtube.com/...', required: false })
    readonly videoUrl?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '450 kg', required: false })
    readonly maxLoad?: string;


    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Tren Inferior Completo', required: false })
    readonly muscleFocus?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Intermedio / Avanzado', required: false })
    readonly recommendedLevel?: string;
}

export class UpdateMachineDto extends PartialType(CreateMachineDto) {}
