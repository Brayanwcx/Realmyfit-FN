import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dtos/setting.dto';
import { JwtAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/models/roles.model';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    // Public API for Footer to fetch settings
    @Get()
    getSettings() {
        return this.settingsService.getSettings();
    }

    // Strict Superadmin-only mutation API
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN)
    @Put()
    updateSettings(@Body() dto: UpdateSettingDto) {
        return this.settingsService.updateSettings(dto);
    }
}
