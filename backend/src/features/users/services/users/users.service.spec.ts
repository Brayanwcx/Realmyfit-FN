import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { RolesService } from '../../../roles/services/roles.service';
import { MailerService } from '@nestjs-modules/mailer';

const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockRolesService = { findByIds: jest.fn().mockResolvedValue([]) } as Partial<RolesService>;
const mockMailerService = { sendMail: jest.fn().mockResolvedValue(true) } as Partial<MailerService>;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: RolesService, useValue: mockRolesService },
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
