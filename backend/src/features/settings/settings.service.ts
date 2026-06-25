import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UpdateSettingDto } from './dtos/setting.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
    constructor(
        @InjectRepository(Setting)
        private settingsRepo: Repository<Setting>,
    ) {}

    async onModuleInit() {
        // Auto-seed a single empty row on startup if it doesn't exist
        const count = await this.settingsRepo.count();
        if (count === 0) {
            const defaultSettings = this.settingsRepo.create({
                id: 1,
                contactEmail: 'contacto@realmyfit.com',
                whatsappNumber: '+57 321-769-0981',
                locationAddress: 'Avenida De Las Americas\\nDuitama, Boyacá',
                googleMapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3969.296449367418!2d-73.03452688983778!3d5.813743594144933!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e6a3f5850f1fadd%3A0x60cf29db10296223!2sSmart%20Fit%20-%20Duitama!5e0!3m2!1ses!2sco!4v1774280406504!5m2!1ses!2sco'
            });
            await this.settingsRepo.save(defaultSettings);
        }
    }

    async getSettings(): Promise<Setting | null> {
        return await this.settingsRepo.findOne({ where: { id: 1 } });
    }

    async updateSettings(dto: UpdateSettingDto): Promise<Setting> {
        let setting = await this.settingsRepo.findOne({ where: { id: 1 } });
        if (!setting) {
            setting = this.settingsRepo.create({ id: 1, ...dto });
        } else {
            Object.assign(setting, dto);
        }
        return await this.settingsRepo.save(setting);
    }
}
