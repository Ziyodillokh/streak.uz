import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    const googleConfig = config.get('googleOAuth'); // ← O'ZGARDI

    super({
      clientID: googleConfig.clientID,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      if (!profile.emails || !profile.emails[0]?.value) {
        throw new UnauthorizedException('Email topilmadi');
      }

      const user = {
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        avatar: profile.photos?.[0]?.value || null,
      };

      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
