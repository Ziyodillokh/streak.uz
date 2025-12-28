import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

import { AccessTokenUserStrategy } from './passport-stratagies/access-token-user/access-token-user.strategy';
import { LocalStrategy } from './passport-stratagies/local/local.strategy';
import { RefreshTokenUserStrategy } from './passport-stratagies/refresh-token-user/refresh-token-user.strategy';

import { AccessTokenUserGuard } from './passport-stratagies/access-token-user/access-token-user.guard';
import { RolesGuard } from './guards/roles.guard';
import { GoogleStrategy } from './strategy/google.strategy';
import { UserModule } from '../users/users.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.getOrThrow('jwt');
        return {
          secret: jwtConfig.accessTokenSecret,
          signOptions: { expiresIn: jwtConfig.accessTokenExpiration },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenUserStrategy,
    LocalStrategy,
    RefreshTokenUserStrategy,
    AccessTokenUserGuard,
    RolesGuard,
    GoogleStrategy,
  ],
  exports: [AuthService, AccessTokenUserGuard, RolesGuard],
})
export class AuthModule {}
