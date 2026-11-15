import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['tenant'],
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByVerificationTokenHash(tokenHash: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.emailVerificationToken')
      .addSelect('user.emailVerificationExpiresAt')
      .where('user.emailVerificationToken = :tokenHash', {
        tokenHash,
      })
      .getOne();
  }

  async findByEmailWithVerificationFields(email: string): Promise<User | null> {
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

  async findByEmailWithPasswordResetFields(
    email: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .addSelect('user.passwordResetExpiresAt')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .addSelect('user.passwordResetExpiresAt')
      .where('user.passwordResetToken = :tokenHash', {
        tokenHash,
      })
      .getOne();
  }

  findAll(tenantId: string) {

    return this.userRepository.find({
      where: {
        tenant: { id: tenantId },
      },
    });
  }
}
