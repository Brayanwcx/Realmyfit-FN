import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: 'El correo debe ser válido' })
    @IsNotEmpty({ message: 'El correo es requerido' })
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty({ message: 'El código de recuperación es requerido' })
    code: string;

    @ApiProperty({ example: 'new_password123' })
    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
    newPassword: string;
}
