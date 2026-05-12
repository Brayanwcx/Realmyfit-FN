import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min, IsEnum } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { MembershipStatus } from '../entities/user-membership.entity';

export class CreateMembershipDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Plan Premium' })
    readonly name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Acceso completo a todas las áreas', required: false })
    readonly description?: string;

    @IsNumber()
    @Min(0)
    @ApiProperty({ example: 99.99 })
    readonly price: number;

    @IsNumber()
    @Min(1)
    @ApiProperty({ example: 30, description: 'Duración en días' })
    readonly durationDays: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Acceso a piscina, sauna, clases grupales', required: false })
    readonly benefits?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true, required: false })
    readonly isActive?: boolean;
}

export class UpdateMembershipDto extends PartialType(CreateMembershipDto) {}

export class CreateUserMembershipDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID del usuario' })
    readonly user_id: number;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1, description: 'ID de la membresía' })
    readonly membership_id: number;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: '2026-04-01' })
    readonly startDate: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: '2026-05-01' })
    readonly endDate: string;

    @IsEnum(MembershipStatus)
    @IsOptional()
    @ApiProperty({ enum: MembershipStatus, example: MembershipStatus.ACTIVE, required: false })
    readonly status?: MembershipStatus;
}

export class UpdateUserMembershipDto extends PartialType(CreateUserMembershipDto) {}
