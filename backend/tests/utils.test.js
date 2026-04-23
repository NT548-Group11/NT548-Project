const validateMongoDbId = require('../src/utils/validateMongodbId');

describe('validateMongoDbId', () => {
  it('returns true for a valid MongoDB ObjectId', () => {
    expect(validateMongoDbId('507f1f77bcf86cd799439011')).toBe(true);
  });

  it('throws an error for an invalid id', () => {
    expect(() => validateMongoDbId('not-valid-id')).toThrow(
      'MongoDB ID is not valid: not-valid-id'
    );
  });

  it('throws an error for empty string', () => {
    expect(() => validateMongoDbId('')).toThrow('MongoDB ID is not valid');
  });

  it('throws for a short numeric string', () => {
    expect(() => validateMongoDbId('12345')).toThrow('MongoDB ID is not valid');
  });
});
