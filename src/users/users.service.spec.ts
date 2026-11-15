import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService.findAll', () => {
  let service: UsersService;
  const find = jest.fn().mockResolvedValue([]);

  beforeEach(async () => {
    find.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: { find } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('only queries users of the given tenant', async () => {
    await service.findAll('tenant-1');

    expect(find).toHaveBeenCalledWith({
      where: { tenant: { id: 'tenant-1' } },
    });
  });
});