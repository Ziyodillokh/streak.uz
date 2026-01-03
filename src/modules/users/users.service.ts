import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from '../position/position.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import { compare, hash } from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { phone: createUserDto.phone },
        { nickname: createUserDto.nickname },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Bunday foydalanuvchi allaqachon mavjud');
    }

    const user = new User();
    Object.assign(user, {
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phone: createUserDto.phone,
      email: createUserDto.email,
      nickname: createUserDto.nickname,
      address: createUserDto.address,
      createdAt: new Date().toISOString(),
      isActive: true,
    });

    // Parolni hash qilish
    if (createUserDto.password) {
      await user.hashPassword(createUserDto.password);
    }

    // Lavozim resolve
    if (createUserDto.position) {
      const position = await this.positionRepository.findOneBy({
        id: createUserDto.position,
      });
      if (!position) throw new NotFoundException('Lavozim topilmadi');
      user.position = position;
    }

    return await this.userRepository.save(user);
  }

  async getOne(id: string) {
    const data = await this.userRepository.findOne({
      where: { id },
      relations: {
        position: true,
      },
    });

    if (!data) {
      throw new NotFoundException('User not found');
    }

    return data;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['position'],
    });
  }
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['position'],
    });

    if (!user) {
      throw new NotFoundException(`User topilmadi`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['position'],
    });

    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    Object.assign(user, {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      phone: dto.phone ?? user.phone,
      email: dto.email ?? user.email,
      nickname: dto.nickname ?? user.nickname,
      address: dto.address ?? user.address,
      sportCategory: dto.sportCategoryId,
    });

    if (dto.password) {
      await user.hashPassword(dto.password);
    }

    if (dto.position) {
      const position = await this.positionRepository.findOneBy({
        id: dto.position,
      });
      if (!position) throw new NotFoundException('Lavozim topilmadi');
      user.position = position;
    }

    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async validateUser(login: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ email: login }, { phone: login }, { nickname: login }],
    });

    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const isMatch = await compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Parol noto‘g‘ri');

    return user;
  }

  async getByLogin(login: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [{ email: login }, { phone: login }, { nickname: login }],
      relations: ['position'],
    });
  }

  async register(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: [
        { email: dto.email },
        { phone: dto.phone },
        { nickname: dto.nickname },
      ],
    });

    if (existing) {
      throw new ConflictException('Bu foydalanuvchi allaqachon mavjud');
    }

    const hashedPassword = await hash(dto.password, 10);

    const user = this.userRepository.create({
      email: dto.email,
      phone: dto.phone,
      nickname: dto.nickname,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      position: dto.position ? { id: dto.position } : undefined,
      address: dto.address,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: true,
      isVerify: true,
    });

    return await this.userRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }
}
