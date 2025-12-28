import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionModule } from '../position/position.module';
import { Position } from '../position/position.entity';
import { User } from './entities/user.entity';
import { UserController } from './users.controller';
import { UserService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Position]), PositionModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
