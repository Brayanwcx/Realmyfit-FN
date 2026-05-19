import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { CreateContactDto, UpdateContactDto } from '../dtos/contact.dto';

@Injectable()
export class ContactsService {
    constructor(
        @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    ) {}

    async findAll() {
        return this.contactRepo.find({ order: { createdAt: 'DESC' } });
    }

    async findOne(id: number) {
        const contact = await this.contactRepo.findOne({ where: { id } });
        if (!contact) {
            throw new NotFoundException(`Contact message #${id} not found`);
        }
        return contact;
    }

    async create(dto: CreateContactDto) {
        const contact = this.contactRepo.create(dto);
        return this.contactRepo.save(contact);
    }

    async update(id: number, dto: UpdateContactDto) {
        const contact = await this.findOne(id);
        this.contactRepo.merge(contact, dto);
        return this.contactRepo.save(contact);
    }

    async remove(id: number) {
        const contact = await this.findOne(id);
        return this.contactRepo.remove(contact);
    }
}
