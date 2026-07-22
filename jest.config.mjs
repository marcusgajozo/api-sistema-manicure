/** @type {import('jest').Config} */
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/generated/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/../src/$1',
    '^@test/e2e/setup/(.*)$': '<rootDir>/../test/e2e/setup/$1',
    '^@test/e2e/helpers/(.*)$': '<rootDir>/../test/e2e/helpers/$1',
    '^@test/e2e/src/(.*)$': '<rootDir>/../test/e2e/src/$1',
    '^@test/e2e/(.*)$': '<rootDir>/../test/e2e/src/$1',
    '^@/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/../test/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../test/jest.setup.ts'],
};
