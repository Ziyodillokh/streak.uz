import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';

import { AuthService } from '../../auth.service';

export const ACCESS_TOKEN_USER = 'access_token_user';

@Injectable()
export class AccessTokenUserStrategy extends PassportStrategy(
  Strategy,
  ACCESS_TOKEN_USER,
) {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    const jwtConfig = configService.getOrThrow('jwt');
    super({
      jwtFromRequest: (req: Request) => {
        let token: string | null = null;

        // 1. Cookie'dan olish (string literal ishlatish)
        if (req && req.cookies) {
          token = req.cookies['access_token_user'];
        }

        // 2. Header'dan olish (fallback)
        if (!token && req.headers.authorization) {
          const authHeader = req.headers.authorization;
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          }
        }

        // Debug (keyinchalik o'chirish mumkin)
        if (!token) {
          console.log('[JWT] Token topilmadi');
          console.log('[JWT] Cookies:', req.cookies);
        }

        return token;
      },
      ignoreExpiration: false,
      secretOrKey: jwtConfig.accessTokenSecret,
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.authService.validateUserById(payload.sub);
    return user;
  }
}
