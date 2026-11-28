import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH)
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH)
  newPassword: string;
}
