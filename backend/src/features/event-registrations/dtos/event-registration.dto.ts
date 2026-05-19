import { IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { RegistrationStatus } from '../entities/event-registration.entity';

export class CreateEventRegistrationDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID del usuario' })
    readonly user_id: number;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID del evento' })
    readonly event_id: number;

    @IsEnum(RegistrationStatus)
    @IsOptional()
    @ApiProperty({ enum: RegistrationStatus, example: RegistrationStatus.PENDING, required: false })
    readonly status?: RegistrationStatus;
}

export class UpdateEventRegistrationDto extends PartialType(CreateEventRegistrationDto) {}
