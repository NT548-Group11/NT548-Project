import { get, post, del, patch, put } from '../../utils/request';

jest.mock('../../helpers/cookie', () => ({
  getCookie: jest.fn(),
}));

jest.mock('../../services/usersServices', () => ({
  refreshToken: jest.fn(),
}));

import { getCookie } from '../../helpers/cookie';
import { refreshToken } from '../../services/usersServices';

const mockJsonResponse = (data, status = 200) => ({
  status,
  json: jest.fn().mockResolvedValue(data),
});

describe('HTTP request utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCookie.mockReturnValue(null);
    global.fetch = jest.fn();
  });

  // ---------- get ----------
  describe('get()', () => {
    it('makes a GET request and returns parsed JSON', async () => {
      global.fetch.mockResolvedValue(mockJsonResponse({ data: 'ok' }));

      const result = await get('/api/test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({ method: 'GET', credentials: 'include' })
      );
      expect(result).toEqual({ data: 'ok' });
    });

    it('includes Authorization header when access token cookie exists', async () => {
      getCookie.mockReturnValue('my-access-token');
      global.fetch.mockResolvedValue(mockJsonResponse({ user: 'test' }));

      await get('/api/me');

      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer my-access-token');
    });

    it('refreshes token and retries on 401 response', async () => {
      refreshToken.mockResolvedValue('refreshed-token');
      global.fetch
        .mockResolvedValueOnce(mockJsonResponse({}, 401))
        .mockResolvedValueOnce(mockJsonResponse({ data: 'retried' }));

      const result = await get('/api/protected');

      expect(refreshToken).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'retried' });
    });

    it('throws error when 401 and refreshToken returns null', async () => {
      refreshToken.mockResolvedValue(null);
      global.fetch.mockResolvedValue(mockJsonResponse({}, 401));

      await expect(get('/api/protected')).rejects.toThrow('Failed to refresh token');
    });
  });

  // ---------- post ----------
  describe('post()', () => {
    it('makes a POST request with body and returns JSON', async () => {
      const body = { username: 'user', password: 'pass' };
      global.fetch.mockResolvedValue(mockJsonResponse({ token: 'abc' }));

      const result = await post('/api/login', body);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/login',
        expect.objectContaining({ method: 'POST', body: JSON.stringify(body) })
      );
      expect(result).toEqual({ token: 'abc' });
    });

    it('makes a POST request without body when no options provided', async () => {
      global.fetch.mockResolvedValue(mockJsonResponse({ ok: true }));

      await post('/api/ping');

      const [, options] = global.fetch.mock.calls[0];
      expect(options.body).toBeUndefined();
    });

    it('includes auth header when token exists', async () => {
      getCookie.mockReturnValue('token123');
      global.fetch.mockResolvedValue(mockJsonResponse({}));

      await post('/api/data', { key: 'val' });

      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer token123');
    });
  });

  // ---------- del ----------
  describe('del()', () => {
    it('makes a DELETE request and returns JSON', async () => {
      global.fetch.mockResolvedValue(mockJsonResponse({ deleted: true }));

      const result = await del('/api/item/1', { reason: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/item/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({ deleted: true });
    });

    it('makes a DELETE request with empty body when no options provided', async () => {
      global.fetch.mockResolvedValue(mockJsonResponse({}));

      await del('/api/item/1');

      const [, options] = global.fetch.mock.calls[0];
      expect(options.body).toBe(JSON.stringify({}));
    });
  });

  // ---------- patch ----------
  describe('patch()', () => {
    it('makes a PATCH request with body and returns JSON', async () => {
      const body = { fullname: 'New Name' };
      global.fetch.mockResolvedValue(mockJsonResponse({ success: true }));

      const result = await patch('/api/user/me', body);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/me',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify(body) })
      );
      expect(result).toEqual({ success: true });
    });

    it('does not include auth header when no token cookie', async () => {
      getCookie.mockReturnValue(null);
      global.fetch.mockResolvedValue(mockJsonResponse({}));

      await patch('/api/data', {});

      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers['Authorization']).toBeUndefined();
    });
  });

  // ---------- put ----------
  describe('put()', () => {
    it('makes a PUT request with body and returns JSON', async () => {
      const body = { role: 'admin' };
      global.fetch.mockResolvedValue(mockJsonResponse({ updated: true }));

      const result = await put('/api/user/role', body);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/role',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) })
      );
      expect(result).toEqual({ updated: true });
    });

    it('includes auth header when token is present', async () => {
      getCookie.mockReturnValue('admin-token');
      global.fetch.mockResolvedValue(mockJsonResponse({}));

      await put('/api/admin/action', {});

      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer admin-token');
    });
  });
});
