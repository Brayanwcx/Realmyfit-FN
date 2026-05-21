import { Module } from '@nestjs/common';
import { AuthService } from '../auth/services/auth.service';
import { AuthController } from '../auth/controllers/auth.controller';
import { UsersModule } from '../features/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { ConfigType } from '@nestjs/config';
import config from '../core/config';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../features/users/entities/user.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [config.KEY],
      useFactory: (configType: ConfigType<typeof config>) => ({
        secret: configType.jwt.secret,
        signOptions: { expiresIn: configType.jwt.expiresIn },
      }),
    }),
  ],
  providers: [AuthService, RolesGuard, JwtAuthGuard, JwtStrategy, GoogleStrategy],
  controllers: [AuthController],
  exports: [AuthService, RolesGuard, JwtAuthGuard],
})
export class AuthModule {}

