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

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'X500', required: false })
    readonly model?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'SN-12345678', required: false })
    readonly serialNumber?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Área de cardio', required: false })
    readonly location?: string;

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
}

export class UpdateMachineDto extends PartialType(CreateMachineDto) {}
