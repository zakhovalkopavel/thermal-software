import { BadRequestException } from '@nestjs/common';

export function resolveFuelFlow(mFuel_kgs: number | undefined, fPower_W: number | undefined, lhv_Jkg: number): number {
  if ((mFuel_kgs === undefined) === (fPower_W === undefined)) {
    throw new BadRequestException('Specify exactly one of `mFuel_kgs` or `fPower_W`');
  }
  if (mFuel_kgs !== undefined) return mFuel_kgs;
  if (lhv_Jkg <= 0) throw new BadRequestException('Fuel LHV must be positive to derive the flow from power');
  return fPower_W! / lhv_Jkg;
}
