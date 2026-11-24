import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProfileRequestDto } from './profile-request.dto';

export class ProfileAtDepthsRequestDto extends ProfileRequestDto {
  @ApiProperty({
    description: 'Normalised spatial coordinates (0 = centre, 1 = surface)',
    example: [0, 0.25, 0.5, 0.75, 1.0],
    type: [Number],
  })
  @IsArray() @IsNumber({}, { each: true })
  relativeDepths: number[];
}
