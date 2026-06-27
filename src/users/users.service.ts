import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    const allUser = await this.userRepository.find();

    return allUser;
  }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser)
      throw new ConflictException('User with this email already exists');

    const newUser = this.userRepository.create(createUserDto);

    const hashedPassword = await bcrypt.hash(newUser.password, 10);

    newUser.password = hashedPassword;

    const savedUser = await this.userRepository.save(newUser);

    const { password, ...userWithoutPassword } = savedUser;

    return userWithoutPassword;
  }

  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException('User not found');

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
