/**
 * Maps an `/info/...` CMS path to the calculator route that owns it.
 * `/info/materials/gases/pure` → `/materials/gases`
 * `/info/processes/htc/details/nusselt-correlations` → `/processes/htc`
 */
export class CalculatorPathFromInfoPath {
  static resolve(infoPath: string): string | null {
    const match = infoPath.match(/^\/info\/(materials|processes)\/([^/?#]+)/);
    if (!match) {
      return null;
    }
    return `/${match[1]}/${match[2]}`;
  }
}
