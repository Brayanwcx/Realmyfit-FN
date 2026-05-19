import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trainer } from './entities/trainer.entity';
import { TrainersService } from './services/trainers.service';
import { TrainersController } from './controllers/trainers.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Trainer])],
    providers: [TrainersService],
    controllers: [TrainersController],
    exports: [TrainersService],
})
export class TrainersModule {}
