import {
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users/users.service';
import * as bcrypt from 'bcrypt';
import { UserModel } from '../../users/interfaces/user';
import { RegisterDto } from '../dtos/register.dto';
import { Role as AuthRole } from '../models/roles.model';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenLog } from '../entities/token-log.entity';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import type { ConfigType } from '@nestjs/config';
import config from '../../config';
import { RolesService } from '../../roles/services/roles.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly rolesService: RolesService,
        @InjectRepository(TokenLog)
        private readonly tokenLogRepo: Repository<TokenLog>,
        @Inject(config.KEY)
        private readonly configType: ConfigType<typeof config>,
    ) { }

    async validateUser(email: string, password: string) {
        let user: User;
        try {
            user = await this.usersService.findByEmail(email);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new UnauthorizedException('Invalid credentials');
            }
            throw error;
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.sanitizeUser(user);
    }

    async register(payload: RegisterDto) {
        const roles = await this.resolveRoles(payload.roleIds);

        const createdUser = await this.usersService.create({
            ...payload,
            isActive: true,
            roleIds: roles.map((role) => role.id),
        });

        const fullUser = await this.usersService.findByEmail(createdUser.email);
        return this.login(this.sanitizeUser(fullUser));
    }

    async login(user: UserModel) {
        const tokenId = randomUUID();
        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.roles?.map(r => r.name) || [],
            jti: tokenId,
        };
        const accessToken = this.jwtService.sign(payload);
        const expiresAt = new Date(
            Date.now() + this.configType.jwt.expiresIn * 1000,
        );

        await this.tokenLogRepo.save(
            this.tokenLogRepo.create({
                tokenId,
                user: { id: user.id } as User,
                expiresAt,
            }),
        );

        return {
            access_token: accessToken,
            token_id: tokenId,
            expires_at: expiresAt,
            user,
        };
    }

    private sanitizeUser(user: User) {
        const { password: _, ...result } = user;
        return result;
    }

    private async resolveRoles(roleIds?: number[]) {
        if (roleIds && roleIds.length > 0) {
            const roles = await this.rolesService.findByIds(roleIds);
            if (roles.length !== roleIds.length) {
                throw new NotFoundException('Some roles were not found');
            }
            return roles;
        }

        const defaultRoleName = AuthRole.USER;
        let defaultRole = (await this.rolesService.findAll()).find(
            (role) => role.name === defaultRoleName,
        );

        if (!defaultRole) {
            defaultRole = await this.rolesService.create({
                name: defaultRoleName,
                description: 'Rol por defecto para nuevos usuarios',
            });
        }
        return [defaultRole];
    }

}
