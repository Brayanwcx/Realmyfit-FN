import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from 'src/users/dtos/user.dto';

@Injectable()
export class UsersService {

    users: User[] = [];
    constructor(@InjectRepository(User) private userRepo: Repository<User>){}

    async findAll(){
        this.users = await this.userRepo.find();
        return this.users;
    }

    async findOne(userId: number){
        const user = await this.userRepo.findOne({where: { id: userId }});
        if (!user) {
            throw new NotFoundException(`User #${userId} not found`);
        }
        return user;
    }

    createUser(payload: CreateUserDto){
        const newUser = this.userRepo.create(payload);
        return this.userRepo.save(newUser);
    }

    async updateUser(id: number, payloadUpdated: UpdateUserDto){
        const user = await this.userRepo.findOne({where:{id}});
        if (!user) {
            throw new NotFoundException(`User #${id} not found`);
        }
        this.userRepo.merge(user, payloadUpdated);
    }

    deleteUser(idUser: number){
        return this.userRepo.delete(idUser);
    }
}
