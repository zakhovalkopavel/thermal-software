import { OxideCompositionDto } from '../dto/common/common.dto';

/**
 * Plain wt% record of the oxides present in the request.
 * With target ES2022 every declared DTO field exists on the instance, so omitted oxides arrive as `undefined`.
 */
export function toOxideCompositionRecord(composition: OxideCompositionDto): Record<string, number> {
  return Object.fromEntries(
    Object.entries(composition).filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
  );
}
