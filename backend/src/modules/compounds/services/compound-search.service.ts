import { Injectable } from '@nestjs/common';
import { CompoundSearch } from '../../../common/thermal/utils/compound-data';
import { CompoundSearchHitDto } from '../dto/compound-search-hit.dto';

@Injectable()
export class CompoundSearchService {
  search(
    q: string | undefined,
    limit?: number,
    gasesOnly?: boolean,
    liquidsOnly?: boolean,
  ): CompoundSearchHitDto[] {
    return CompoundSearch.search(q ?? '', { limit, gasesOnly, liquidsOnly });
  }
}
