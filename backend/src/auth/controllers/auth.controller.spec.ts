import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';

import { AuthService } from '../services/auth.service';
import { UsersService } from '../../features/users/services/users/users.service';

const mockAuthService = { login: jest.fn(), forgotPassword: jest.fn(), resetPassword: jest.fn(), loginWithGoogle: jest.fn() } as Partial<AuthService>;
const mockUsersService = { create: jest.fn(), findOne: jest.fn(), findByEmail: jest.fn() } as Partial<UsersService>;

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
