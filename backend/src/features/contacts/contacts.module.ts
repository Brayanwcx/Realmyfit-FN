import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { ContactsService } from './services/contacts.service';
import { ContactsController } from './controllers/contacts.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Contact])],
    providers: [ContactsService],
    controllers: [ContactsController],
    exports: [ContactsService],
})
export class ContactsModule {}
