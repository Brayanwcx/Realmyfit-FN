import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';

import { UsersService } from '../../services/users/users.service';

const mockUsersService = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), updateUser: jest.fn(), deleteUser: jest.fn() } as Partial<UsersService>;

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
