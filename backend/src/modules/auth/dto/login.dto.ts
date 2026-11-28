import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

export class LoginDto {
  @ApiProperty()
  @IsString()
  @MinLength(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH)
  password: string;
}
