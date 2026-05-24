module.exports = {
  // Môi trường chạy test
  testEnvironment: 'node',

  // Nạp biến môi trường (JWT_SECRET, ...) trước khi chạy test
  setupFiles: ['<rootDir>/tests/setup.js'],

  // Folder chứa coverage report
  coverageDirectory: 'coverage',

  // Format report (lcov cho SonarQube, text cho terminal, html cho dev)
  coverageReporters: ['lcov', 'text', 'html'],

  // Files cần đo coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],

  // Cho phép pass khi chưa có test (tránh fail pipeline)
  passWithNoTests: true,

  // Pattern tìm test files
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Bỏ qua các folder khi tìm test
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],

  // Tự động clear mock giữa các test
  clearMocks: true,

  // Verbose output cho dễ debug
  verbose: true
};