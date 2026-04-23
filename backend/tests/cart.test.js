const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/payosConfig', () => ({
  createPaymentLink: jest.fn(),
}));
jest.mock('../src/controllers/emailCtrl', () => ({
  sendEmail: jest.fn(),
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed'),
}));
jest.mock('../src/models/userModel', () => {
  const MockUser = jest.fn();
  MockUser.findOne = jest.fn();
  MockUser.findById = jest.fn();
  MockUser.find = jest.fn();
  MockUser.create = jest.fn();
  MockUser.findByIdAndUpdate = jest.fn();
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
jest.mock('../src/models/productModel', () => {
  const MockProduct = jest.fn();
  MockProduct.findById = jest.fn();
  MockProduct.find = jest.fn();
  MockProduct.create = jest.fn();
  MockProduct.findOneAndUpdate = jest.fn();
  MockProduct.findOneAndDelete = jest.fn();
  MockProduct.findByIdAndUpdate = jest.fn();
  MockProduct.updateOne = jest.fn();
  MockProduct.bulkWrite = jest.fn();
  return MockProduct;
});
jest.mock('../src/models/categoryModel', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../src/models/orderModel', () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock('../src/models/couponModel', () => ({ findOne: jest.fn() }));
jest.mock('../src/models/webhookLog', () => ({
  create: jest.fn(),
  find: jest.fn(),
}));

const app = require('../src/app');
const User = require('../src/models/userModel');
const Cart = require('../src/models/cartModel');
const Product = require('../src/models/productModel');

const VALID_ID = '507f1f77bcf86cd799439011';
const PRODUCT_ID = '507f1f77bcf86cd799439022';

const mockUser = {
  _id: VALID_ID,
  id: VALID_ID,
  email: 'user@example.com',
  role: 'user',
  save: jest.fn().mockResolvedValue(true),
  isPasswordMatched: jest.fn().mockResolvedValue(true),
};

const createMockCart = (overrides = {}) => ({
  _id: 'cart-id',
  orderBy: VALID_ID,
  products: [],
  CartTotal: 0,
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

const genToken = (id = VALID_ID) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

describe('Cart Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockResolvedValue(mockUser);
    User.findOne.mockResolvedValue(null);
    Product.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: PRODUCT_ID, price: 100000 }) });
  });

  // ---------- POST /api/cart/add ----------
  describe('POST /api/cart/add', () => {
    it('adds a product to an existing cart', async () => {
      const token = genToken();
      const mockCart = createMockCart({ products: [] });
      Cart.findOne.mockResolvedValue(mockCart);

      const res = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: PRODUCT_ID, quantity: 2, selectedAttributes: {} });

      expect(res.status).toBe(200);
    });

    it('creates a new cart when none exists for user', async () => {
      const token = genToken();
      Cart.findOne.mockResolvedValue(null);
      const newCart = createMockCart({ products: [] });
      Cart.create.mockResolvedValue(newCart);

      const res = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: PRODUCT_ID, quantity: 1, selectedAttributes: {} });

      expect(res.status).toBe(200);
    });

    it('increments quantity when product with same attributes already in cart', async () => {
      const token = genToken();
      const existingItem = {
        product: { toString: () => PRODUCT_ID },
        quantity: 1,
        price: 100000,
        selectedAttributes: {},
      };
      const mockCart = createMockCart({ products: [existingItem] });
      Cart.findOne.mockResolvedValue(mockCart);

      const res = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: PRODUCT_ID, quantity: 2, selectedAttributes: {} });

      expect(res.status).toBe(200);
    });

    it('returns 400 when product is not found', async () => {
      const token = genToken();
      const mockCart = createMockCart({ products: [] });
      Cart.findOne.mockResolvedValue(mockCart);
      Product.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      const res = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: PRODUCT_ID, quantity: 1, selectedAttributes: {} });

      expect(res.status).toBe(400);
    });

    it('returns 500 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/cart/add')
        .send({ productId: PRODUCT_ID, quantity: 1 });

      expect(res.status).toBe(500);
    });
  });

  // ---------- GET /api/cart/user ----------
  describe('GET /api/cart/user', () => {
    it('returns the cart for the current user', async () => {
      const token = genToken();
      const mockCart = createMockCart({ products: [] });
      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart),
      });

      const res = await request(app)
        .get('/api/cart/user')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('returns 404 when cart not found', async () => {
      const token = genToken();
      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .get('/api/cart/user')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ---------- PATCH /api/cart/update ----------
  describe('PATCH /api/cart/update', () => {
    it('updates quantity of an item in the cart', async () => {
      const token = genToken();
      const existingItem = {
        product: { toString: () => PRODUCT_ID },
        quantity: 1,
        price: 100000,
        selectedAttributes: {},
      };
      const mockCart = createMockCart({ products: [existingItem] });
      Cart.findOne.mockResolvedValue(mockCart);

      const res = await request(app)
        .patch('/api/cart/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: PRODUCT_ID, quantity: 3, selectedAttributes: {} });

      expect(res.status).toBe(200);
    });

    it('returns 404 when cart not found', async () => {
      const token = genToken();
      Cart.findOne.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/cart/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: PRODUCT_ID, quantity: 2, selectedAttributes: {} });

      expect(res.status).toBe(404);
    });

    it('returns 404 when item not found in cart', async () => {
      const token = genToken();
      const mockCart = createMockCart({ products: [] });
      Cart.findOne.mockResolvedValue(mockCart);

      const res = await request(app)
        .patch('/api/cart/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: PRODUCT_ID, quantity: 2, selectedAttributes: {} });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Product not found in cart');
    });
  });

  // ---------- DELETE /api/cart/delete/:productId ----------
  describe('DELETE /api/cart/delete/:productId', () => {
    it('removes an item from the cart', async () => {
      const token = genToken();
      const existingItem = {
        product: { toString: () => PRODUCT_ID },
        quantity: 1,
        price: 100000,
        selectedAttributes: {},
      };
      const mockCart = createMockCart({ products: [existingItem] });
      Cart.findOne.mockResolvedValue(mockCart);

      const res = await request(app)
        .delete(`/api/cart/delete/${PRODUCT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ selectedAttributes: {} });

      expect(res.status).toBe(200);
    });

    it('returns 404 when cart not found', async () => {
      const token = genToken();
      Cart.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/cart/delete/${PRODUCT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ selectedAttributes: {} });

      expect(res.status).toBe(404);
    });
  });

  // ---------- DELETE /api/cart/clear ----------
  describe('DELETE /api/cart/clear', () => {
    it('clears all items from the cart', async () => {
      const token = genToken();
      const mockCart = createMockCart({ products: [{ product: PRODUCT_ID, quantity: 2, price: 100 }] });
      Cart.findOne.mockResolvedValue(mockCart);

      const res = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('returns 404 when cart not found', async () => {
      const token = genToken();
      Cart.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
