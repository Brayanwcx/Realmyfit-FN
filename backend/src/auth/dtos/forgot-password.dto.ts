import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: 'El correo debe ser válido' })
    @IsNotEmpty({ message: 'El correo es requerido' })
    email: string;
}
