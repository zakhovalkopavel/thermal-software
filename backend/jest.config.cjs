module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testRegex: '(/test/.*|(\\.|/)(test|spec))\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  // ml-levenberg-marquardt is a pure ESM package (no CJS build).
  // We must transform it through ts-jest instead of leaving it as-is.
  // The pattern below excludes it (and its sub-deps) from the default
  // "ignore everything in node_modules" rule.
  transformIgnorePatterns: [
    '/node_modules/(?!(ml-levenberg-marquardt)/)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
    // Transform ESM .js files from whitelisted node_modules with ts-jest as well
    '^.+\\.js$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  testTimeout: 20000,
};

