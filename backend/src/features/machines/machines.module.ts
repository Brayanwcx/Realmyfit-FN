import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine } from './entities/machine.entity';
import { MachinesService } from './services/machines.service';
import { MachinesController } from './controllers/machines.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Machine])],
    providers: [MachinesService],
    controllers: [MachinesController],
    exports: [MachinesService],
})
export class MachinesModule {}
