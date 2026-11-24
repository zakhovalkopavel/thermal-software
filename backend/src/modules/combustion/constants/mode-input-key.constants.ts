import { CombustionModeInputDto } from '../dto/combustion-mode';
import { CombustionMode } from '../enums/combustion-mode.enum';

/** Field of `CombustionModeInputDto` holding the input of each combustion mode */
export const MODE_INPUT_KEY: Record<CombustionMode, keyof Omit<CombustionModeInputDto, 'mode'>> = {
  [CombustionMode.SolidDirect]:  'solidDirect',
  [CombustionMode.SolidTwoStep]: 'solidTwoStep',
  [CombustionMode.Fluid]:        'fluid',
  [CombustionMode.Bed]:          'bed',
};
