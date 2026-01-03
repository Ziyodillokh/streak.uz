import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { Public } from './decorators/public.decorator';
import { LocalAuthGuard } from './passport-stratagies/local/local-auth.guard';
import { ACCESS_TOKEN_USER } from './passport-stratagies/access-token-user/access-token-user.strategy';
import { RefreshTokenUserGuard } from './passport-stratagies/refresh-token-user/refresh-token-user.guard';
import { REFRESH_TOKEN_USER } from './passport-stratagies/refresh-token-user/refresh-token-user.strategy';

import { GoogleGuard } from './guards/google.oauth.guard';
import { User } from '../users/user.entity';
import { CreateUserDto } from '../users/dto';

const accessTokenOptions: CookieOptions = {
  secure: true,
  sameSite: 'none',
  maxAge: 31536000000,
};
const refreshTokenOptions: CookieOptions = {
  ...accessTokenOptions,
  httpOnly: true,
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @HttpCode(200)
  @ApiNoContentResponse({
    description: 'New access, refresh tokens have been saved.',
  })
  @ApiBadRequestResponse({ description: 'Something went wrong from FE' })
  async login(
    @Req() { user }: { user: User },
    @Res({ passthrough: true }) response: Response,
    @Body() _: LoginDto,
  ) {
    if (!(await this.authService.isValidUser(user.id))) {
      response.clearCookie(ACCESS_TOKEN_USER, accessTokenOptions);
      response.clearCookie(REFRESH_TOKEN_USER, refreshTokenOptions);
      throw new UnauthorizedException();
    }
    const accessToken = this.authService.getJWT('access', user.id);
    const refreshToken = this.authService.getJWT('refresh', user.id);
    response.cookie(ACCESS_TOKEN_USER, accessToken, accessTokenOptions);
    response.cookie(REFRESH_TOKEN_USER, refreshToken, refreshTokenOptions);
    const fullUser = await this.authService.fullUserData(user.id);
    return { accessToken, refreshToken, user: fullUser ?? user };
  }

  @Public()
  @Post('/logout')
  @HttpCode(200)
  @ApiNoContentResponse({
    description: 'The user was logged out successfully',
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(ACCESS_TOKEN_USER, accessTokenOptions);
    response.clearCookie(REFRESH_TOKEN_USER, refreshTokenOptions);
  }

  @Public()
  @UseGuards(RefreshTokenUserGuard)
  @Post('/refresh')
  @HttpCode(200)
  @ApiNoContentResponse({
    description: 'New access, refresh tokens have been saved.',
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  async refresh(
    @Req() { user }: { user: User },
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!(await this.authService.isValidUser(user.id))) {
      response.clearCookie(ACCESS_TOKEN_USER, accessTokenOptions);
      response.clearCookie(REFRESH_TOKEN_USER, refreshTokenOptions);
      throw new UnauthorizedException();
    }
    const accessToken = this.authService.getJWT('access', user.id);
    const refreshToken = this.authService.getJWT('refresh', user.id);
    response.cookie(ACCESS_TOKEN_USER, accessToken, accessTokenOptions);
    response.cookie(REFRESH_TOKEN_USER, refreshToken, refreshTokenOptions);

    return { accessToken, refreshToken, user };
  }

  @Post('send-code')
  @ApiQuery({ name: 'email', type: String })
  sendCode(@Query('email') email: string) {
    return this.authService.sendVerificationEmail(email);
  }

  @Post('verify-code')
  @ApiQuery({ name: 'email', type: String, required: true })
  @ApiQuery({ name: 'code', type: String, required: true })
  verifyCode(@Query('email') email: string, @Query('code') code: string) {
    if (!email || !code) {
      throw new BadRequestException('Email va kod talab qilinadi');
    }
    return this.authService.verifyEmailCode(email, code);
  }

  @Public()
  @Post('/register')
  @HttpCode(201)
  @ApiNoContentResponse({
    description: 'User successfully registered and logged in',
  })
  @ApiBadRequestResponse({ description: 'Validation or registration error' })
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.register(dto);

    const accessToken = this.authService.getJWT('access', user.id);
    const refreshToken = this.authService.getJWT('refresh', user.id);

    response.cookie(ACCESS_TOKEN_USER, accessToken, accessTokenOptions);
    response.cookie(REFRESH_TOKEN_USER, refreshToken, refreshTokenOptions);

    return { accessToken, refreshToken, user };
  }

  /**
   * Google orqali login qilish uchun endpoint.
   * Bu yerda hech qanday javob qaytarmaslik kerak, faqat guard ishlaydi.
   * Tekshiruv va log qo'shildi.
   */
  @Public()
  @Get('google')
  @UseGuards(GoogleGuard)
  googleAuth(@Req() req) {
    console.log('[GOOGLE AUTH] /auth/google endpoint chaqirildi');
    // Bu yerda hech narsa qaytarmang, GoogleGuard o'zi redirect qiladi.
  }

  /**
   * Google login callback endpointi.
   * Bu yerda faqat redirect qilinadi, CORS headerlar kerak emas.
   * Tekshiruv va log qo'shildi.
   * Agar curl yoki Swagger orqali chaqirilsa, foydalanuvchiga aniq xabar qaytariladi.
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleCallback(@Req() req, @Res() res: Response) {
    console.log('[GOOGLE CALLBACK] /auth/google/callback endpoint chaqirildi');
    if (!req.user) {
      console.error('[GOOGLE CALLBACK] req.user yo‘q!');
      // Swagger yoki curl orqali chaqirilganda foydalanuvchiga aniq xabar
      return res.status(400).json({
        error:
          'Google foydalanuvchisi topilmadi. Ushbu endpoint faqat Google OAuth redirect orqali ishlaydi. Iltimos, browser orqali Google login flowdan foydalaning.',
      });
    }
    const result = await this.authService.googleLogin(req.user);
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/success?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
    console.log('[GOOGLE CALLBACK] user:', result.user);
    console.log('[GOOGLE CALLBACK] redirectUrl:', redirectUrl);

    // Frontend'ga tokenlar bilan redirect qiladi
    return res.redirect(redirectUrl);
  }

  @Post('change-password/send-code')
  @ApiQuery({ name: 'email', type: String })
  sendCodeForChangePassword(@Query('email') email: string) {
    return this.authService.sendCodeForChangePassword(email);
  }

  @Post('change-password/verify-code')
  @ApiQuery({ name: 'email', type: String, required: true })
  @ApiQuery({ name: 'code', type: String, required: true })
  verifyCodeForChangePassword(
    @Query('email') email: string,
    @Query('code') code: string,
  ) {
    if (!email || !code) {
      throw new BadRequestException('Email va kod talab qilinadi');
    }
    return this.authService.verifyChangePasswordCode(email, code);
  }

  @Public()
  @Post('change-password')
  @ApiQuery({ name: 'email', type: String, required: true })
  @ApiQuery({ name: 'newPassword', type: String, required: true })
  async changePassword(
    @Query('email') email: string,
    @Query('newPassword') newPassword: string,
  ) {
    if (!email || !newPassword) {
      throw new BadRequestException('Email va yangi password talab qilinadi');
    }
    return this.authService.changePassword(email, newPassword);
  }

  @Get('test')
  async test() {
    return this.authService.test();
  }
}
