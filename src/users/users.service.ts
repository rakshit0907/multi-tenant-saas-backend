import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { ClsService } from 'nestjs-cls';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cls: ClsService,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }
  async findByEmail(email: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { email }, relations: ['tenant'],  });
}

async findByEmailWithPassword(email: string): Promise<User | null> {
  return this.userRepository
    .createQueryBuilder('user')
    .addSelect('user.password')
    .leftJoinAndSelect('user.tenant', 'tenant')
    .where('user.email = :email', { email })
    .getOne();
}

async findByVerificationTokenHash(tokenHash: string,
): Promise<User | null> {
  return this.userRepository
    .createQueryBuilder('user')
    .addSelect('user.emailVerificationToken')
    .addSelect('user.emailVerificationExpiresAt')
    .where('user.emailVerificationToken = :tokenHash', {
      tokenHash,
    })
    .getOne();
}

async findByEmailWithVerificationFields(
  email: string,
): Promise<User | null> {
  return this.userRepository
    .createQueryBuilder('user')
    .addSelect('user.emailVerificationToken')
    .addSelect('user.emailVerificationExpiresAt')
    .where('user.email = :email', { email })
    .getOne();
}

async save(user: User): Promise<User> {
  return this.userRepository.save(user);
}


findAll() {
  const tenantId = this.cls.get('tenantId');
  
  return this.userRepository.find({
    where: {
      tenant: { id: tenantId },
    },
  });
}
}