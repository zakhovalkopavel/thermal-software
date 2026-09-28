import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MaterialGroupRoute } from '../enums/material-group-route.enum';

export class MaterialGroupRouteParamDto {
  @ApiProperty({ enum: MaterialGroupRoute, example: MaterialGroupRoute.OXIDES })
  @IsEnum(MaterialGroupRoute)
  groupRoute: MaterialGroupRoute;
}
