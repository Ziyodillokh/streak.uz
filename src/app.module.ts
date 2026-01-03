import { ConfigModule, ConfigService } from '@nestjs/config';
import { IsUniqueConstraint } from './infra/shared/decorators/is-unique.constrain';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from '../config';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { MinioClientModule } from './modules/minio-client/minio-client.module';
import { PositionModule } from './modules/position/position.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { UserModule } from './modules/users/users.module';
import { HabitsModule } from './modules/habits/habits.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow('database'),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../uploads'),
    }),
    AuthModule,
    UserModule,
    MediaModule,
    MinioClientModule,
    PositionModule,
    HabitsModule,
  ],

  providers: [IsUniqueConstraint],
})
export class AppModule {}
