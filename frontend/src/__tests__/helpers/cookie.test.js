import { getCookie, deleteCookie } from '../../helpers/cookie';

describe('cookie helpers', () => {
  beforeEach(() => {
    // Reset cookies before each test by clearing what we can
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (name) {
        document.cookie = `${name}=; max-age=0; path=/`;
      }
    });
  });

  describe('getCookie', () => {
    it('returns the value of an existing cookie', () => {
      document.cookie = 'accessToken=mytoken123; path=/';
      expect(getCookie('accessToken')).toBe('mytoken123');
    });

    it('returns null when the cookie does not exist', () => {
      expect(getCookie('nonexistentCookie')).toBeNull();
    });

    it('returns the correct cookie when multiple cookies exist', () => {
      document.cookie = 'firstName=John; path=/';
      document.cookie = 'lastName=Doe; path=/';
      expect(getCookie('firstName')).toBe('John');
      expect(getCookie('lastName')).toBe('Doe');
    });

    it('decodes URI-encoded cookie values', () => {
      document.cookie = `encodedVal=${encodeURIComponent('hello world')}; path=/`;
      expect(getCookie('encodedVal')).toBe('hello world');
    });
  });

  describe('deleteCookie', () => {
    it('removes a cookie by setting max-age to 0', () => {
      document.cookie = 'tempCookie=value; path=/';
      expect(getCookie('tempCookie')).toBe('value');

      deleteCookie('tempCookie');
      expect(getCookie('tempCookie')).toBeNull();
    });

    it('does not throw when deleting a non-existent cookie', () => {
      expect(() => deleteCookie('nonexistent')).not.toThrow();
    });
  });
});
