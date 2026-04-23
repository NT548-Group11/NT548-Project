module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/cronWebhook.js',
  ],
  coverageDirectory: 'coverage',
};
