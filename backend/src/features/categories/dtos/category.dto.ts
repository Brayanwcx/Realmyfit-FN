import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    readonly description?: string;
}

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    readonly name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    readonly description?: string;
}
