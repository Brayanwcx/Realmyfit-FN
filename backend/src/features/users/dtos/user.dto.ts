/* eslint-disable prettier/prettier */
import { IsString, IsNotEmpty, IsArray, ArrayNotEmpty, IsInt, IsBoolean, IsOptional } from "class-validator";
import { PartialType, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly lastName: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly docType: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly docNumber: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly password: string;

    @IsBoolean()
    @IsNotEmpty()
    @ApiProperty()
    readonly isActive: boolean;

    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    @Type(() => Number)
    @ApiProperty({ type: [Number] })
    readonly roleIds: number[];
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    readonly profilePicture?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }