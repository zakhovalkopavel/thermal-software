import { ApiProperty } from '@nestjs/swagger';
import { ComponentEffectDto } from './component-effect.dto';

export class ComponentBreakdownDto {
  @ApiProperty({ type: [ComponentEffectDto] })
  networkFormers: ComponentEffectDto[];

  @ApiProperty({ type: [ComponentEffectDto] })
  networkModifiers: ComponentEffectDto[];

  @ApiProperty({ type: [ComponentEffectDto] })
  fluorides: ComponentEffectDto[];

  @ApiProperty({ type: [ComponentEffectDto] })
  chlorides: ComponentEffectDto[];
}
