import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../../dtos/user.dto';
import { RolesService } from '../../../roles/services/roles.service';
import * as bcrypt from 'bcrypt';
// Importación de MailerService removida

@Injectable()
export class UsersService {

    users: User[] = [];
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        private rolesService: RolesService,
    ) { }

    async findAll() {
        return await this.userRepo.find({ relations: ['roles'] });
    }

    // async findByEmail(email: string) {
    //     const user = await this.userRepo.findOne({ where: { email: email } });
    //     if (!user) {
    //         throw new NotFoundException(`User ${email} not found`);
    //     }
    //     return user;
    // }



    async findByEmail(email: string) {
        const user = await this.userRepo.findOne({
            where: { email },
            relations: ['roles'],
        });

        if (!user) {
            throw new NotFoundException(`User ${email} not found`);
        }
        return user;
    }

    async findOne(userId: number) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['roles', 'userMemberships', 'userMemberships.membership', 'orders', 'eventRegistrations', 'eventRegistrations.event']
        });
        if (!user) {
            throw new NotFoundException(`User #${userId} not found`);
        }
        return user;
    }

    // createUser(payload: CreateUserDto){
    //     const newUser = this.userRepo.create(payload);
    //     return this.userRepo.save(newUser);
    // }

    async create(createUserDto: CreateUserDto) {
        const { roleIds, password, ...userData } = createUserDto;
        
        const existingUser = await this.userRepo.findOne({ where: { email: userData.email } });
        if (existingUser) {
            throw new BadRequestException('El correo electrónico ya está registrado.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const roles = await this.rolesService.findByIds(roleIds);

        if (roles.length !== roleIds.length) {
            throw new NotFoundException('Some roles were not found');
        }

        const newUser = this.userRepo.create({
            ...userData,
            password: hashedPassword, //Guardamos la encriptada
            roles,
        });
        const savedUser = await this.userRepo.save(newUser);

        // Enviando correo de bienvenida mediante Brevo HTTP API
        const brevoPayload = {
            sender: { name: 'RealMyFit', email: process.env.SMTP_USER }, // Gmail autorizado de Brevo
            to: [{ email: savedUser.email }],
            subject: '¡Bienvenido a RealMyFit!',
            htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a12; color: #ffffff; padding: 40px 20px; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #10101c; border: 1px solid rgba(39, 174, 96, 0.3); border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
                        <h1 style="color: #27ae60; margin-bottom: 5px; font-size: 32px; font-weight: 800; letter-spacing: -1px;">RealMyFit</h1>
                        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 25px; font-weight: 600;">¡Bienvenido a la comunidad!</h2>
                        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            Hola <strong style="color: #ffffff;">${savedUser.name}</strong>,<br><br>
                            Estamos muy emocionados de tenerte con nosotros. Tu cuenta ha sido creada exitosamente. Prepárate para transformar tu vida y alcanzar tu máximo potencial con la mejor tecnología de entrenamiento.
                        </p>
                        <div style="margin: 40px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/login" style="display: inline-block; background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: #ffffff; text-decoration: none; padding: 15px 35px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);">
                                Iniciar Sesión Ahora
                            </a>
                        </div>
                        <p style="color: #555566; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 25px; line-height: 1.5;">
                            Si tienes alguna duda, responde a este correo para contactar a soporte.<br><br>
                            El equipo de RealMyFit
                        </p>
                    </div>
                </div>
            `
        };

        fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.SMTP_PASSWORD || '', // En lugar del SMTP Password de Gmail ahora usaremos la llave de Brevo aquí
                'content-type': 'application/json'
            },
            body: JSON.stringify(brevoPayload)
        })
        .then(res => res.json())
        .then(data => console.log('Correo Brevo enviado:', data))
        .catch(err => console.error('Error enviando correo con Brevo:', err));

        return savedUser;
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto) {
        const { roleIds, password, ...userData } = updateUserDto;

        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['roles'],
        });

        if (!user) throw new NotFoundException('User not found');

        // actualizar roles
        if (roleIds) {
            const roles = await this.rolesService.findByIds(roleIds);

            if (roles.length !== roleIds.length) {
                throw new NotFoundException('Some roles were not found');
            }

            user.roles = roles;
        }

        // actualizar password solo si viene
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        // actualizar resto de datos
        this.userRepo.merge(user, userData);

        return this.userRepo.save(user);
    }

    // async updateUser(id: number, payloadUpdated: UpdateUserDto) {
    //     const user = await this.userRepo.findOne({ where: { id } });
    //     if (!user) {
    //         throw new NotFoundException(`User #${id} not found`);
    //     }
    //     this.userRepo.merge(user, payloadUpdated);
    // }

    deleteUser(idUser: number) {
        return this.userRepo.delete(idUser);
    }

    async getWishlist(userId: number) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['wishlist']
        });
        if (!user) throw new NotFoundException('User not found');
        return user.wishlist;
    }

    async addToWishlist(userId: number, productId: number) {
        await this.userRepo.createQueryBuilder()
            .relation(User, 'wishlist')
            .of(userId)
            .add(productId);
        return { message: 'Product added to wishlist' };
    }

    async removeFromWishlist(userId: number, productId: number) {
        await this.userRepo.createQueryBuilder()
            .relation(User, 'wishlist')
            .of(userId)
            .remove(productId);
        return { message: 'Product removed from wishlist' };
    }
}
