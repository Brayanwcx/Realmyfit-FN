import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingDto {
    @ApiPropertyOptional({ example: 'contacto@realmyfit.com' })
    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @ApiPropertyOptional({ example: '+57 321 000 0000' })
    @IsOptional()
    @IsString()
    whatsappNumber?: string;

    @ApiPropertyOptional({ example: 'Avenida De Las Americas, Duitama' })
    @IsOptional()
    @IsString()
    locationAddress?: string;

    @ApiPropertyOptional({ example: 'https://www.google.com/maps/embed?...' })
    @IsOptional()
    @IsString()
    googleMapsUrl?: string;
}
