import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../features/users/entities/user.entity';
import { UsersService } from '../../features/users/services/users/users.service';
import * as bcrypt from 'bcrypt';
import { UserModel } from '../../features/users/interfaces/user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// MailerService removido - usando Brevo HTTP API
import { ResetPasswordDto } from '../dtos/reset-password.dto';

@Injectable()
export class AuthService {

    private forgotPasswordLimits = new Map<string, number>();

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        @InjectRepository(User) private userRepo: Repository<User>,
    ) { }

    async validateUser(email: string, password: string) {
        const user: User = await this.usersService.findByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Su cuenta ha sido inhabilitada. Contacte a soporte.');
        }

        const { password: _, ...result } = user;
        return result;
    }

    async login(user: UserModel) {
        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.roles?.map(r => r.name) || [],
        };

        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async loginWithGoogle(googleUser: {
        googleId: string;
        email: string;
        name: string;
        lastName: string;
        profilePicture: string;
    }) {
        // Buscar por googleId o email
        let user = await this.userRepo.findOne({
            where: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
            relations: ['roles'],
        });

        if (!user) {
            // Crear usuario nuevo para Google
            const defaultRole = await this.userRepo.manager
                .getRepository('Role')
                .findOne({ where: { name: 'USER' } })
                .catch(() => null);

            user = this.userRepo.create({
                googleId: googleUser.googleId,
                email: googleUser.email,
                name: googleUser.name,
                lastName: googleUser.lastName || '',
                docType: 'GOOGLE',
                docNumber: googleUser.googleId.substring(0, 10),
                profilePicture: googleUser.profilePicture,
                isActive: true,
                roles: defaultRole ? [defaultRole] : [],
            });
            user = await this.userRepo.save(user);

            // Recargar con relaciones
            user = await this.userRepo.findOne({
                where: { id: user.id },
                relations: ['roles'],
            });
        } else if (!user.googleId) {
            // El email ya existía pero sin googleId → vincular cuenta
            user.googleId = googleUser.googleId;
            if (googleUser.profilePicture && !user.profilePicture) {
                user.profilePicture = googleUser.profilePicture;
            }
            await this.userRepo.save(user);
        }

        if (!user) throw new Error('No se pudo crear o encontrar el usuario de Google');

        if (!user.isActive) {
            throw new UnauthorizedException('Su cuenta ha sido inhabilitada. Contacte a soporte.');
        }

        const payload = {
            sub: user!.id,
            email: user!.email,
            roles: user!.roles?.map(r => r.name) || [],
        };

        const { password, ...userWithoutPassword } = user as any;

        return {
            access_token: this.jwtService.sign(payload),
            user: userWithoutPassword,
        };
    }

    async forgotPassword(email: string) {
        const now = Date.now();
        const lastRequest = this.forgotPasswordLimits.get(email);
        
        // Limitar peticiones a 1 cada 2 minutos por correo
        if (lastRequest && (now - lastRequest) < 120000) {
            return { message: 'Si el correo está registrado, recibirás un código de recuperación.' };
        }
        
        // Registrar el intento
        this.forgotPasswordLimits.set(email, now);

        // Limpieza de caché simple
        if (this.forgotPasswordLimits.size > 5000) {
            this.forgotPasswordLimits.clear();
        }

        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // No revelamos si el correo existe o no por seguridad, pero sí podemos devolver un mensaje de éxito genérico
            return { message: 'Si el correo está registrado, recibirás un código de recuperación.' };
        }

        // Generar código de 6 dígitos
        const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Expiración de 15 minutos
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        user.recoveryCode = recoveryCode;
        user.recoveryCodeExpiresAt = expiresAt;
        await this.userRepo.save(user);

        // Enviar correo mediante Brevo HTTP API
        const brevoPayload = {
            sender: { name: 'RealMyFit', email: process.env.SMTP_USER },
            to: [{ email: user.email }],
            subject: 'Código de Recuperación de Contraseña - RealMyFit',
            htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a12; color: #ffffff; padding: 40px 20px; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #10101c; border: 1px solid rgba(39, 174, 96, 0.3); border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
                        <h1 style="color: #27ae60; margin-bottom: 5px; font-size: 32px; font-weight: 800; letter-spacing: -1px;">RealMyFit</h1>
                        <h2 style="color: #ffffff; font-size: 22px; margin-bottom: 25px; font-weight: 600;">Recuperación de Contraseña</h2>
                        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            Hola <strong style="color: #ffffff;">${user.name}</strong>,<br><br>
                            Has solicitado restablecer tu contraseña. Utiliza el siguiente código de 6 dígitos para continuar con el proceso:
                        </p>
                        <div style="background-color: #0a0a12; border: 1px dashed rgba(39, 174, 96, 0.5); border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                            <h1 style="margin: 0; font-size: 42px; letter-spacing: 12px; color: #27ae60;">${recoveryCode}</h1>
                        </div>
                        <p style="color: #a0a0a0; font-size: 14px; margin-bottom: 30px;">
                            <strong style="color: #ff4757;">Atención:</strong> Este código expirará en 15 minutos.
                        </p>
                        <p style="color: #555566; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 25px; line-height: 1.5;">
                            Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu cuenta sigue protegida.
                            <br><br>El equipo de RealMyFit
                        </p>
                    </div>
                </div>
            `
        };

        await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.SMTP_PASSWORD || '',
                'content-type': 'application/json'
            },
            body: JSON.stringify(brevoPayload)
        });

        return { message: 'Si el correo está registrado, recibirás un código de recuperación.' };
    }

    async resetPassword(resetDto: ResetPasswordDto) {
        const user = await this.usersService.findByEmail(resetDto.email);

        if (!user || user.recoveryCode !== resetDto.code) {
            throw new UnauthorizedException('Código de recuperación inválido o expirado.');
        }

        const now = new Date();
        if (!user.recoveryCodeExpiresAt || user.recoveryCodeExpiresAt < now) {
            throw new UnauthorizedException('El código de recuperación ha expirado.');
        }

        // Verify if the new password is the same as the current one
        const isSamePassword = await bcrypt.compare(resetDto.newPassword, user.password);
        if (isSamePassword) {
            throw new BadRequestException('La nueva contraseña debe ser diferente a tu contraseña actual.');
        }

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(resetDto.newPassword, salt);

        // Actualizar usuario
        user.password = hashedPassword;
        user.recoveryCode = null;
        user.recoveryCodeExpiresAt = null;

        await this.userRepo.save(user);

        return { message: 'Tu contraseña ha sido restablecida exitosamente.' };
    }
}

