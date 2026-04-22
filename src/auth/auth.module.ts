import { Module } from '@nestjs/common';
import { AuthService } from '../auth/services/auth.service';
import { AuthController } from '../auth/controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigType } from '@nestjs/config';
import config from '../config';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenLog } from './entities/token-log.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PassportModule,
    TypeOrmModule.forFeature([TokenLog]),
    JwtModule.registerAsync({
      inject: [config.KEY],
      useFactory: (configType: ConfigType<typeof config>) => ({
        secret: configType.jwt.secret,
        signOptions: { expiresIn: configType.jwt.expiresIn },
      }),
    }),
  ],
  // providers: [AuthService, JwtStrategy],
  providers: [AuthService, RolesGuard, JwtAuthGuard, JwtStrategy], // 🔹 AuthService incluido
  controllers: [AuthController],
  exports: [AuthService, RolesGuard, JwtAuthGuard],
})
export class AuthModule {}
