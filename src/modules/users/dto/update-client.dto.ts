import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
class UpdateClientDto {
  @ApiProperty({
    description: `Firstname`,
    example: 'John',
  })
  @IsOptional()
  @IsString()
  readonly firstName: string;

  @ApiProperty({
    description: `Lastname`,
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  readonly lastName: string;


  @ApiProperty({
    description: `email`,
    example: 'example@gmail.com',
  })
  @IsOptional()
  @IsString()
  readonly email: string;

  @ApiProperty({
    description: `phone`,
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  readonly phone: string;
}

export default UpdateClientDto;
