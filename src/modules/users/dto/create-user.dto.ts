import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEmail,
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
import dayjs from 'dayjs';

@ValidatorConstraint({ name: 'IsEndTimeAfterStartTime', async: false })
class IsEndTimeAfterStartTime implements ValidatorConstraintInterface {
  validate(to: string, args: ValidationArguments) {
    const { from } = args.object as any;
    if (!from || !to) return false;

    return dayjs(`2024-01-01 ${to}`, 'YYYY-MM-DD HH:mm').isAfter(
      dayjs(`2024-01-01 ${from}`, 'YYYY-MM-DD HH:mm'),
    );
  }

  defaultMessage() {
    return 'end_time must be after start_time';
  }
}

class CreateUserDto {
  @ApiProperty({ description: `first name`, example: 'Ali', required: false })
  @IsOptional()
  @IsString()
  readonly firstName: string;

  @ApiProperty({
    description: `last name`,
    example: 'Valiyev',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly lastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiProperty({
    description: `Address`,
    example: 'Chilonzor(Toshkent shahar)',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly address: string;

  @ApiProperty({
    description: `phone`,
    example: '998901234567',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('UZ')
  readonly phone?: string;

  @ApiProperty({ description: `nickname`, example: 'admin' })
  @IsString()
  readonly nickname: string;

  @ApiProperty({ description: `password`, example: 'P@ssw0rd' })
  @IsOptional()
  @IsString()
  readonly password: string;

  @ApiProperty({ description: `position id`, example: 'uuid', required: false })
  @IsOptional()
  @IsString()
  readonly position?: string;
}

export default CreateUserDto;
