const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/payosConfig', () => ({
  createPaymentLink: jest.fn().mockResolvedValue({ checkoutUrl: 'https://pay.example.com' }),
}));
jest.mock('../src/controllers/emailCtrl', () => ({
  sendEmail: jest.fn().mockResolvedValue({}),
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));
jest.mock('../src/models/userModel', () => {
  const MockUser = jest.fn();
  MockUser.findOne = jest.fn();
  MockUser.findById = jest.fn();
  MockUser.find = jest.fn();
  MockUser.create = jest.fn();
  MockUser.findByIdAndUpdate = jest.fn();
  MockUser.findByIdAndDelete = jest.fn();
  MockUser.findOneAndUpdate = jest.fn();
  return MockUser;
});
jest.mock('../src/models/cartModel', () => {
  const MockCart = jest.fn();
  MockCart.create = jest.fn();
  MockCart.findOne = jest.fn();
  MockCart.findOneAndDelete = jest.fn();
  MockCart.findOneAndUpdate = jest.fn();
  MockCart.findByIdAndDelete = jest.fn();
  return MockCart;
});
jest.mock('../src/models/couponModel', () => ({
  findOne: jest.fn(),
}));
jest.mock('../src/models/orderModel', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../src/models/webhookLog', () => ({
  create: jest.fn().mockResolvedValue({}),
  find: jest.fn(),
}));

const app = require('../src/app');
const User = require('../src/models/userModel');
const Cart = require('../src/models/cartModel');
const Coupon = require('../src/models/couponModel');
const Order = require('../src/models/orderModel');
const WebhookLog = require('../src/models/webhookLog');
const bcrypt = require('bcrypt');

const VALID_ID = '507f1f77bcf86cd799439011';
const VALID_ID2 = '507f1f77bcf86cd799439012';

const createMockUser = (overrides = {}) => ({
  _id: VALID_ID,
  id: VALID_ID,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  isBlocked: false,
  refreshToken: '',
  fullname: 'Test User',
  phone: '0123456789',
  password: 'hashed-password',
  address: [],
  save: jest.fn().mockResolvedValue(true),
  isPasswordMatched: jest.fn().mockResolvedValue(true),
  createPasswordResetToken: jest.fn().mockResolvedValue('raw-reset-token'),
  ...overrides,
});

const genToken = (id = VALID_ID) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

describe('Auth / User Routes', () => {
  let mockUser;
  let adminUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = createMockUser();
    adminUser = createMockUser({ role: 'admin', email: 'admin@example.com' });
    User.findById.mockResolvedValue(mockUser);
    User.findOne.mockResolvedValue(null);
    User.find.mockResolvedValue([mockUser]);
    User.create.mockResolvedValue(mockUser);
    User.findByIdAndUpdate.mockResolvedValue(mockUser);
    User.findByIdAndDelete.mockResolvedValue(mockUser);
    User.findOneAndUpdate.mockResolvedValue(mockUser);
    Cart.create.mockResolvedValue({});
    Cart.findOne.mockResolvedValue(null);
    bcrypt.compare.mockResolvedValue(true);
  });

  // ---------- POST /api/user/register ----------
  describe('POST /api/user/register', () => {
    it('creates a new user successfully', async () => {
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      User.create.mockResolvedValue({
        ...mockUser,
        save: jest.fn().mockResolvedValue(true),
      });

      const res = await request(app)
        .post('/api/user/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'pass123' });

      expect(res.status).toBe(201);
    });

    it('returns 400 if email already exists', async () => {
      User.findOne.mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .post('/api/user/register')
        .send({ username: 'newuser', email: 'test@example.com', password: 'pass123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email đã tồn tại');
    });

    it('returns 400 if username already exists', async () => {
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .post('/api/user/register')
        .send({ username: 'testuser', email: 'unique@example.com', password: 'pass123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username đã tồn tại');
    });
  });

  // ---------- POST /api/user/login ----------
  describe('POST /api/user/login', () => {
    it('logs in with valid credentials', async () => {
      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/user/login')
        .send({ username: 'testuser', password: 'pass123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('returns 500 for non-existent user', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/user/login')
        .send({ username: 'nouser', password: 'pass123' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('returns 500 when password does not match', async () => {
      const userBadPass = createMockUser({
        isPasswordMatched: jest.fn().mockResolvedValue(false),
      });
      User.findOne.mockResolvedValue(userBadPass);

      const res = await request(app)
        .post('/api/user/login')
        .send({ username: 'testuser', password: 'wrongpass' });

      expect(res.status).toBe(500);
    });
  });

  // ---------- GET /api/user/all-users ----------
  describe('GET /api/user/all-users', () => {
    it('returns all users', async () => {
      User.find.mockResolvedValue([mockUser]);

      const res = await request(app).get('/api/user/all-users');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ---------- GET /api/user/me ----------
  describe('GET /api/user/me', () => {
    it('returns current user when authenticated', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('returns 500 when no auth token provided', async () => {
      const res = await request(app).get('/api/user/me');
      expect(res.status).toBe(500);
    });
  });

  // ---------- PATCH /api/user/update-me ----------
  describe('PATCH /api/user/update-me', () => {
    it('updates the current user profile', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue({ ...mockUser, fullname: 'Updated Name' });

      const res = await request(app)
        .patch('/api/user/update-me')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ---------- PATCH /api/user/update-address ----------
  describe('PATCH /api/user/update-address', () => {
    it('updates user address when authenticated', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .patch('/api/user/update-address')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fullname: 'Test User',
          phone: '0123456789',
          address: { address: 'HCM', detail_address: '123 Street' },
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User address updated successfully');
    });
  });

  // ---------- PATCH /api/user/change-password ----------
  describe('PATCH /api/user/change-password', () => {
    it('changes password successfully', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app)
        .patch('/api/user/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'oldpass', newPassword: 'newpass' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Mật khẩu đã được thay đổi thành công');
    });

    it('returns 400 when old password is wrong', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .patch('/api/user/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'wrongpass', newPassword: 'newpass' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Mật khẩu cũ không đúng');
    });
  });

  // ---------- POST /api/user/logout ----------
  describe('POST /api/user/logout', () => {
    it('returns 400 when no refresh token cookie', async () => {
      const res = await request(app).post('/api/user/logout');
      expect(res.status).toBe(400);
    });

    it('logs out and clears the refresh token cookie', async () => {
      User.findOne.mockResolvedValue(mockUser);
      User.findOneAndUpdate.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/user/logout')
        .set('Cookie', 'refreshToken=some-refresh-token');

      expect(res.status).toBe(204);
    });

    it('logs out and returns 204 when user not found by refresh token', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/user/logout')
        .set('Cookie', 'refreshToken=some-token');

      expect(res.status).toBe(204);
    });
  });

  // ---------- GET /api/user/refresh ----------
  describe('GET /api/user/refresh', () => {
    it('returns 500 when no refresh token in cookies', async () => {
      const res = await request(app).get('/api/user/refresh');
      expect(res.status).toBe(500);
    });

    it('returns new access token with valid refresh token', async () => {
      const validRefreshToken = jwt.sign(
        { id: VALID_ID },
        process.env.JWT_SECRET,
        { expiresIn: '3d' }
      );
      User.findOne.mockResolvedValue({ ...mockUser, id: VALID_ID });

      const res = await request(app)
        .get('/api/user/refresh')
        .set('Cookie', `refreshToken=${validRefreshToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });
  });

  // ---------- DELETE /api/user/:id ----------
  describe('DELETE /api/user/:id', () => {
    it('deletes a user by valid id', async () => {
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      const res = await request(app).delete(`/api/user/${VALID_ID}`);
      expect(res.status).toBe(200);
    });

    it('returns 500 for invalid MongoDB id', async () => {
      const res = await request(app).delete('/api/user/bad-id');
      expect(res.status).toBe(500);
    });
  });

  // ---------- POST /api/user/forgot-password ----------
  describe('POST /api/user/forgot-password', () => {
    it('sends password reset token for existing email', async () => {
      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/user/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
    });

    it('returns 500 for unknown email', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/user/forgot-password')
        .send({ email: 'unknown@example.com' });

      expect(res.status).toBe(500);
    });
  });

  // ---------- PATCH /api/user/reset-password/:token ----------
  describe('PATCH /api/user/reset-password/:token', () => {
    it('resets password with valid token', async () => {
      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .patch('/api/user/reset-password/valid-raw-token')
        .send({ password: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Đặt lại mật khẩu thành công');
    });

    it('returns 500 for expired or invalid token', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/user/reset-password/invalid-token')
        .send({ password: 'newpassword123' });

      expect(res.status).toBe(500);
    });
  });

  // ---------- POST /api/user/webhook ----------
  describe('POST /api/user/webhook', () => {
    it('handles incoming webhook and returns 200', async () => {
      WebhookLog.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/user/webhook')
        .send({ data: { orderCode: 12345, code: '00' } });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Received');
    });
  });

  // ---------- POST /api/user/process-orders ----------
  describe('POST /api/user/process-orders', () => {
    it('processes no unprocessed webhook logs and returns empty array', async () => {
      WebhookLog.find.mockResolvedValue([]);

      const res = await request(app).post('/api/user/process-orders');

      expect(res.status).toBe(200);
      expect(res.body.createdOrders).toHaveLength(0);
    });
  });

  // ---------- PUT /api/user/block-user/:id (admin) ----------
  describe('PUT /api/user/block-user/:id', () => {
    it('blocks a user when called by admin', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(adminUser);
      User.findOne.mockResolvedValue(adminUser);
      User.findByIdAndUpdate.mockResolvedValue({ ...adminUser, isBlocked: true });

      const res = await request(app)
        .put(`/api/user/block-user/${VALID_ID2}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User blocked successfully');
    });
  });

  // ---------- PUT /api/user/unblock-user/:id (admin) ----------
  describe('PUT /api/user/unblock-user/:id', () => {
    it('unblocks a user when called by admin', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(adminUser);
      User.findOne.mockResolvedValue(adminUser);
      User.findByIdAndUpdate.mockResolvedValue({ ...adminUser, isBlocked: false });

      const res = await request(app)
        .put(`/api/user/unblock-user/${VALID_ID2}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User unblocked successfully');
    });
  });

  // ---------- PUT /api/user/change-role/:id (admin) ----------
  describe('PUT /api/user/change-role/:id', () => {
    it('changes a user role to admin', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(adminUser);
      User.findOne.mockResolvedValue(adminUser);
      User.findByIdAndUpdate.mockResolvedValue({ ...mockUser, role: 'admin' });

      const res = await request(app)
        .put(`/api/user/change-role/${VALID_ID2}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Role updated successfully');
    });

    it('returns 400 when role is not provided', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(adminUser);
      User.findOne.mockResolvedValue(adminUser);

      const res = await request(app)
        .put(`/api/user/change-role/${VALID_ID2}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ---------- PUT /api/user/cart/apply-coupon ----------
  describe('PUT /api/user/cart/apply-coupon', () => {
    it('applies a product coupon and returns discounted total', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(mockUser);
      Cart.findOne.mockResolvedValue({
        CartTotal: 500000,
        orderBy: VALID_ID,
        save: jest.fn().mockResolvedValue(true),
      });
      Coupon.findOne.mockResolvedValue({
        name: 'SAVE10',
        isActive: true,
        type: 'product',
        expiry: new Date(Date.now() + 86400000),
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 0,
      });
      Cart.findOneAndUpdate.mockResolvedValue({});

      const res = await request(app)
        .put('/api/user/cart/apply-coupon')
        .set('Authorization', `Bearer ${token}`)
        .send({ coupon: 'SAVE10' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalAfterDiscount');
    });

    it('returns 500 when cart is not found', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(mockUser);
      Cart.findOne.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/user/cart/apply-coupon')
        .set('Authorization', `Bearer ${token}`)
        .send({ coupon: 'SAVE10' });

      expect(res.status).toBe(500);
    });
  });

  // ---------- GET /api/user/:id (admin) ----------
  describe('GET /api/user/:id', () => {
    it('gets a single user by id (admin)', async () => {
      const token = genToken();
      User.findById
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(mockUser);
      User.findOne.mockResolvedValue(adminUser);

      const res = await request(app)
        .get(`/api/user/${VALID_ID2}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
