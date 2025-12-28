import {
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import dayjs from 'dayjs';

@ValidatorConstraint({ name: 'IsEndTimeAfterStartTime', async: false })
class IsEndTimeAfterStartTime implements ValidatorConstraintInterface {
  validate(to: string, args: ValidationArguments) {
    const { from } = args.object as any;
    console.log('args.object =======>', args.object);
    console.log('to ================>', to);
    if (!from || !to) return false;
    return dayjs(`2024-01-01 ${to}`, 'YYYY-MM-DD HH:mm').isAfter(
      dayjs(`2024-01-01 ${from}`, 'YYYY-MM-DD HH:mm'),
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'end_time must be after start_time';
  }
}

class UpdateUserDto {
  @ApiProperty({
    description: `filial id`,
    example: 'uuid',
  })
  @IsOptional()
  @IsString()
  readonly filial?: string;

  @ApiProperty({
    description: `first name`,
    example: 'qweewrterw',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly firstName?: string;

  @ApiProperty({
    description: `last name`,
    example: 'qweretr',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly lastName?: string;

  @ApiProperty({
    description: `father name`,
    example: '1231231231',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly fatherName?: string;

  @ApiProperty({
    description: `hired`,
    example: 'date',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly hired?: string;

  @ApiProperty({
    description: `position id`,
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly position?: string;

  @ApiProperty({ description: `start time`, example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time must be in HH:mm format',
  })
  from?: string;

  @ApiProperty({ description: `end time`, example: '17:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time must be in HH:mm format',
  })
  @Validate(IsEndTimeAfterStartTime)
  to?: string;

  @ApiProperty({
    description: `phone`,
    example: '1231231231',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly phone?: string;

  @ApiProperty({
    description: `password`,
    example: '1231231231',
    required: true,
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: `Address`,
    example: 'Chilonzor(Toshkent shahar)',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly address?: string;

  @ApiProperty({ description: `nickname`, example: 'admin' })
  @IsString()
  @IsOptional()
  readonly nickname?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly sportCategoryId?: string;
}

export default UpdateUserDto;
