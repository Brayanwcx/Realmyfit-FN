/* eslint-disable prettier/prettier */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    ArrayNotEmpty,
    IsArray,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    Matches,
} from "class-validator";

export class RegisterDto {
    @IsString()
    @MinLength(2)
    @IsNotEmpty()
    @ApiProperty()
    readonly name: string;

    @IsString()
    @MinLength(2)
    @IsNotEmpty()
    @ApiProperty()
    readonly lastName: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly docType: string;

    @IsString()
    @Matches(/^[A-Za-z0-9-]{5,20}$/)
    @IsNotEmpty()

    
    @ApiProperty({ example: "12345678" })
    readonly docNumber: string;

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    readonly email: string;

    @IsString()
    @MinLength(6)
    @ApiProperty({ minLength: 6 })
    readonly password: string;

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    @Type(() => Number)
    @ApiPropertyOptional({ type: [Number], example: [1] })
    readonly roleIds?: number[];
}
