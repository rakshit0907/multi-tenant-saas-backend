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
findAll() {
  const tenantId = this.cls.get('tenantId');
  
  return this.userRepository.find({
    where: {
      tenant: { id: tenantId },
    },
  });
}
}