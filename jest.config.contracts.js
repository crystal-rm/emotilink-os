module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.contracts.js'],
  testMatch: ['<rootDir>/test/**/*.test.js'],
  collectCoverageFrom: [
    'contracts/**/*.sol',
    '!contracts/**/*.test.sol',
    '!contracts/mocks/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  globals: {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
  },
};
