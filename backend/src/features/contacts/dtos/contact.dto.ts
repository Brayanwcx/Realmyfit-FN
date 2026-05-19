import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Juan Pérez' })
    readonly name: string;

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({ example: 'juan@email.com' })
    readonly email: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '3001234567', required: false })
    readonly phone?: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Consulta sobre membresías' })
    readonly subject: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Quisiera saber los precios de las membresías mensuales' })
    readonly message: string;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {
    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true, required: false })
    readonly isRead?: boolean;
}
