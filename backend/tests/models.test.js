// Unit tests for Mongoose models — exercise the real model source
// (no jest.mock on the models) so schema definitions and userModel's
// instance methods / pre-save hook are counted in coverage.
//
// Uses mongodb-memory-server so .save() fires the real pre-save hook
// through the public API instead of poking Mongoose internals.

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('test-salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const BlogCategory = require('../src/models/blogCatModel');
const Cart = require('../src/models/cartModel');
const Order = require('../src/models/orderModel');
const User = require('../src/models/userModel');

const VALID_ID = '507f1f77bcf86cd799439011';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Mongoose models', () => {
  describe('BlogCategory model', () => {
    it('is registered under the BlogCategory model name', () => {
      expect(BlogCategory.modelName).toBe('BlogCategory');
    });

    it('requires a title', () => {
      const doc = new BlogCategory({});
      const err = doc.validateSync();
      expect(err.errors.title).toBeDefined();
    });

    it('validates a document with a title', () => {
      const doc = new BlogCategory({ title: 'Nutrition' });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.title).toBe('Nutrition');
    });
  });

  describe('Cart model', () => {
    it('is registered under the Cart model name', () => {
      expect(Cart.modelName).toBe('Cart');
    });

    it('builds a cart with products and totals', () => {
      const cart = new Cart({
        products: [
          {
            product: VALID_ID,
            selectedAttributes: { size: 'L' },
            quantity: 2,
            price: 100,
          },
        ],
        orderBy: VALID_ID,
        CartTotal: 200,
        totalAfterDiscount: 180,
        orderCode: 12345,
      });

      expect(cart.validateSync()).toBeUndefined();
      expect(cart.products).toHaveLength(1);
      expect(cart.products[0].selectedAttributes.get('size')).toBe('L');
      expect(cart.CartTotal).toBe(200);
    });
  });

  describe('Order model', () => {
    it('is registered under the Order model name', () => {
      expect(Order.modelName).toBe('Order');
    });

    it('applies default orderStatus and totalAmount', () => {
      const order = new Order({ orderCode: 999, orderBy: VALID_ID });
      expect(order.orderStatus).toBe('Not Processed');
      expect(order.totalAmount).toBe(0);
    });

    it('accepts a valid orderStatus from the enum', () => {
      const order = new Order({ orderCode: 1000, orderStatus: 'Delivered' });
      expect(order.validateSync()).toBeUndefined();
      expect(order.orderStatus).toBe('Delivered');
    });

    it('rejects an orderStatus outside the enum', () => {
      const order = new Order({ orderCode: 1001, orderStatus: 'Teleported' });
      const err = order.validateSync();
      expect(err.errors.orderStatus).toBeDefined();
    });
  });

  describe('User model', () => {
    beforeEach(() => {
      bcrypt.genSalt.mockClear();
      bcrypt.hash.mockClear();
      bcrypt.compare.mockClear();
    });

    it('is registered under the User model name', () => {
      expect(User.modelName).toBe('User');
    });

    it('requires username, email and password', () => {
      const user = new User({});
      const err = user.validateSync();
      expect(err.errors.username).toBeDefined();
      expect(err.errors.email).toBeDefined();
      expect(err.errors.password).toBeDefined();
    });

    it('applies defaults for role, isBlocked, cart and gender', () => {
      const user = new User({
        username: 'tester',
        email: 'tester@example.com',
        password: 'secret',
      });
      expect(user.role).toBe('user');
      expect(user.isBlocked).toBe(false);
      expect(user.cart).toEqual([]);
      expect(user.gender).toBe('other');
    });

    it('rejects a role outside the enum', () => {
      const user = new User({
        username: 'tester',
        email: 'tester@example.com',
        password: 'secret',
        role: 'superadmin',
      });
      const err = user.validateSync();
      expect(err.errors.role).toBeDefined();
    });

    it('embeds address subdocuments requiring address and detail_address', () => {
      const user = new User({
        username: 'tester',
        email: 'tester@example.com',
        password: 'secret',
        address: [{ address: 'District 1', detail_address: '123 Street' }],
      });
      expect(user.validateSync()).toBeUndefined();
      expect(user.address[0].address).toBe('District 1');

      const bad = new User({
        username: 'tester2',
        email: 'tester2@example.com',
        password: 'secret',
        address: [{ address: 'No detail' }],
      });
      const err = bad.validateSync();
      expect(err.errors['address.0.detail_address']).toBeDefined();
    });

    describe('pre-save hook', () => {
      it('hashes the password when it is modified', async () => {
        const user = new User({
          username: 'save-hash',
          email: 'save-hash@example.com',
          password: 'plain-password',
        });
        await user.save();

        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 'test-salt');
        expect(user.password).toBe('hashed-password');
      });

      it('does not re-hash the password when it is unmodified', async () => {
        const user = await User.create({
          username: 'no-change',
          email: 'no-change@example.com',
          password: 'plain-password',
        });
        bcrypt.hash.mockClear();
        user.fullname = 'Updated Name';
        await user.save();

        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(user.password).toBe('hashed-password'); // unchanged
      });
    });

    describe('isPasswordMatched', () => {
      it('delegates to bcrypt.compare', async () => {
        bcrypt.compare.mockResolvedValue(true);
        const user = new User({
          username: 'matcher',
          email: 'matcher@example.com',
          password: 'hashed-password',
        });

        const result = await user.isPasswordMatched('plain-password');
        expect(bcrypt.compare).toHaveBeenCalledWith('plain-password', 'hashed-password');
        expect(result).toBe(true);
      });
    });

    describe('createPasswordResetToken', () => {
      it('sets a hashed reset token and an expiry in the future', async () => {
        const user = new User({
          username: 'reset',
          email: 'reset@example.com',
          password: 'hashed-password',
        });

        const before = Date.now();
        const token = await user.createPasswordResetToken();

        expect(typeof token).toBe('string');
        expect(token).toHaveLength(64); // 32 random bytes as hex
        expect(user.passwordResetToken).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
        expect(user.passwordResetToken).not.toBe(token);
        expect(user.passwordResetExpires.getTime()).toBeGreaterThan(before);
      });
    });
  });
});
