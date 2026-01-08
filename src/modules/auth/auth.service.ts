import * as bcrypt from 'bcrypt';
import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';

import axios from 'axios';
import Redis from 'ioredis';
import { GoogleUser } from './interfaces';
import { UserService } from '../users/users.service';
import { ensureEnv } from 'src/infra/shared/helpers/ensureEnv';
import { User } from '../users/user.entity';
import { CreateUserDto } from '../users/dto';

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: ensureEnv('REDIS_HOST'),
      port: parseInt(ensureEnv('REDIS_PORT'), 10),
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    });
  }

  async validateUserByEmailPassword(login: string, password: string) {
    const user = await this.userService.getByLogin(login);
    console.log('user-->', user);

    if (!user) {
      throw new BadRequestException('Invalid login.');
    }

    const isPasswordSame = await this.comparePasswordWithHash(
      password,
      user.password,
    );

    if (!isPasswordSame) {
      throw new BadRequestException('Invalid password');
    }

    return user;
  }

  async sendVerificationEmail(email: string) {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Redis ga saqlash
      await this.redis.set(`verify:${email}`, code, 'EX', 300);

      const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Email verification</h2>
        <p>Your code is: <strong>${code}</strong></p>
      </div>
    `;

      // API key tekshirish
      const apiKey = this.configService.get<string>('RESEND_API_KEY');
      if (!apiKey) {
        throw new Error('RESEND_API_KEY undefined');
      }

      await axios.post(
        'https://api.resend.com/emails',
        {
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Your Verification Code',
          html,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return { message: 'Kod yuborildi', email };
    } catch (error) {
      console.error('sendVerificationEmail error:', error.message || error);
      throw new InternalServerErrorException(
        'Email yuborishda xato. Iltimos, keyinroq urinib ko‘ring',
      );
    }
  }

  async verifyEmailCode(email: string, code: string) {
    const storedCode = await this.redis.get(`verify:${email}`);

    if (!storedCode || storedCode !== code) {
      throw new BadRequestException("Kod noto'g'ri yoki muddati o'tgan");
    }

    await this.redis.del(`verify:${email}`);
    return { message: 'Email tasdiqlandi' };
  }

  async validateUserById(userId: string) {
    const user = await this.userService.getOne(userId).catch(() => {
      throw new BadRequestException('Valid token with non-existent user.');
    });
    return user;
  }

  async comparePasswordWithHash(password: string, hash: string) {
    const isSame = await bcrypt.compare(password, hash);
    return isSame;
  }

  getJWT(type: 'access' | 'refresh', sub: string) {
    const payload = { sub };

    if (type === 'access') {
      return this.jwtService.sign(payload);
    }

    const jwtConfig = this.configService.getOrThrow('jwt');
    return this.jwtService.sign(payload, {
      secret: jwtConfig.refreshTokenSecret,
      expiresIn: jwtConfig.refreshTokenExpiration,
    });
  }

  async isValidUser(id: string): Promise<boolean> {
    const user = await this.userService.getOne(id);
    return !!user?.isActive;
  }

  async register(dto: CreateUserDto): Promise<User> {
    const user = await this.userService.register(dto);
    return user;
  }

  async fullUserData(id: string): Promise<User | undefined> {
    let fullUser = await this.userService.findOne(id);

    if (fullUser) {
      return fullUser;
    } else {
      return undefined;
    }
  }

  async googleLogin(googleUser: GoogleUser) {
    let user = await this.userService.getByLogin(googleUser.email);

    if (!user) {
      const randomPass = await bcrypt.hash(Math.random().toString(36), 10);
      const dto: CreateUserDto = {
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        nickname: `google_${googleUser.googleId}`,
        password: randomPass,
        address: '',
        telegramId: '',
        photoUrl: googleUser.avatar || '',
      };
      user = await this.userService.register(dto);
    }

    return {
      user,
      accessToken: this.getJWT('access', user.id),
      refreshToken: this.getJWT('refresh', user.id),
    };
  }

  // Telegram orqali login
  async telegramLogin(telegramData: {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  }): Promise<User> {
    // Telegram ID orqali foydalanuvchini qidirish
    let user = await this.userService.findByTelegramId(telegramData.telegramId);

    if (!user) {
      // Yangi foydalanuvchi yaratish
      const randomPass = await bcrypt.hash(Math.random().toString(36), 10);
      const dto: CreateUserDto = {
        email: `telegram_${telegramData.telegramId}@telegram.user`,
        firstName: telegramData.firstName,
        lastName: telegramData.lastName || '',
        nickname: telegramData.username || `user_${telegramData.telegramId}`,
        password: randomPass,
        address: '',
        telegramId: telegramData.telegramId,
        photoUrl: telegramData.photoUrl || '',
      };
      user = await this.userService.register(dto);
    }

    return user;
  }

  async test() {
    return 'Auth service is working!';
  }

  async sendCodeForChangePassword(email: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const existingCode = await this.redis.get(`change_password:${email}`);
    if (existingCode) {
      throw new BadRequestException(
        'Kod allaqachon yuborilgan. Iltimos, 3 daqiqa kuting.',
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.redis.set(`change_password:${email}`, code, 'EX', 180);

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Parolni o\'zgartirish tasdiqlash</h2>
      <p>Hurmatli foydalanuvchi,</p>
      <p>Parolingizni o\'zgartirish uchun tasdiqlash kodi:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
        ${code}
      </div>
      <p style="color: #666; font-size: 14px;">
        Bu kod 3 daqiqa davomida amal qiladi.
      </p>
      <p style="color: #999; font-size: 12px;">
        Agar siz bu so\'rovni yubormasangiz, bu xabarni e'tiborsiz qoldiring.
      </p>
    </div>
  `;

    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'UzChamp <noreply@uzchamp.uz>',
        to: email,
        subject: "Parolni o\'zgartirish kodi",
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      message: 'Tasdiqlash kodi emailingizga yuborildi',
    };
  }

  async verifyChangePasswordCode(email: string, code: string) {
    const storedCode = await this.redis.get(`change_password:${email}`);

    if (!storedCode || storedCode !== code) {
      throw new BadRequestException("Kod noto\'g'ri yoki muddati o\'tgan");
    }

    await this.redis.del(`change_password:${email}`);
    return { message: 'Kod tasdiqlandi' };
  }

  async changePassword(
    email: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.update(user.id, { password: hashedPassword });

    return { message: "Parol muvaffaqiyatli o\'zgartirildi" };
  }
}
