import { RefKey } from '../../../../enum/ref-key.enum';

export interface CompoundDataSourceFile {
  /** Table name used in the build report, e.g. "Perry 2-151" */
  name: string;
  /**
   * Path in the source repository; repository path for local files, e.g. "shared/sources/transport-parameters.json".
   * `null` when the row cites a book page and there is no source file (`ref` line is that page).
   */
  path: string | null;
  /** `null` for the identifier databases */
  ref: RefKey | null;
  /**
   * File URL pinned to `sourceCommit`; `null` for local files: the PubChem class files (use `pubchemCid`) and the
   * transport-parameters tables (`white12`, `white13`, `whiteA6`, `whiteA7`, `itean1961T3`, `mamedov2014T1`,
   * `svehla1995T1`)
   */
  url: string | null;
}
