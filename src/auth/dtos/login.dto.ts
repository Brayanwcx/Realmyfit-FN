/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    readonly email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly password: string;
}