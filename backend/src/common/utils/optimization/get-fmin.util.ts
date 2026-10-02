import * as fs from 'fs';
import { FminExports } from './fmin-exports.interface';

// fmin@0.0.4 ships "type":"module" in package.json but the actual build/fmin.js
// is a UMD bundle. Dynamic import() fails because Node treats it as ESM.
// Solution: load the UMD source text and execute it via Function() which bypasses
// the module-type check while fully initialising the CJS exports object.

let _fmin: FminExports | null = null;

/** Singleton loader of the fmin UMD bundle. */
export function getFmin(): FminExports {
  if (_fmin) return _fmin;
  const fminPath = require.resolve('fmin/build/fmin.js');
  const src = fs.readFileSync(fminPath, 'utf8');
  const mod = { exports: {} as FminExports };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
  _fmin = mod.exports;
  return _fmin;
}
