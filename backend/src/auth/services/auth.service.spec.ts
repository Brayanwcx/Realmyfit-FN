import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../features/users/entities/user.entity';
import { UsersService } from '../../features/users/services/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

const mockUsersService = { findByEmail: jest.fn() } as Partial<UsersService>;
const mockJwtService = { sign: jest.fn().mockReturnValue('token') } as Partial<JwtService>;
const mockRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockMailerService = { sendMail: jest.fn() } as Partial<MailerService>;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
