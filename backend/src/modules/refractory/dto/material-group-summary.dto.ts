import { ApiProperty } from '@nestjs/swagger';
import { MaterialGroup } from '../enums/material-group.enum';
import { MaterialGroupRoute } from '../enums/material-group-route.enum';

export class MaterialGroupSummaryDto {
  @ApiProperty({ enum: MaterialGroup })
  group: MaterialGroup;

  @ApiProperty({ enum: MaterialGroupRoute, description: 'Path segment of GET /refractory/:groupRoute' })
  route: MaterialGroupRoute;

  @ApiProperty({ example: 'Oxides' })
  label: string;

  @ApiProperty({ description: 'Number of unique active materials in the group' })
  count: number;
}
