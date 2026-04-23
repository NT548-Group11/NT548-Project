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
jest.mock('../src/models/productModel', () => {
  const MockProduct = jest.fn();
  MockProduct.find = jest.fn();
  MockProduct.findById = jest.fn();
  MockProduct.create = jest.fn();
  MockProduct.findOneAndUpdate = jest.fn();
  MockProduct.findOneAndDelete = jest.fn();
  MockProduct.findByIdAndUpdate = jest.fn();
  MockProduct.updateOne = jest.fn();
  MockProduct.bulkWrite = jest.fn();
  return MockProduct;
});
jest.mock('../src/models/categoryModel', () => {
  const MockCategory = jest.fn();
  MockCategory.findById = jest.fn();
  MockCategory.find = jest.fn();
  MockCategory.create = jest.fn();
  MockCategory.findByIdAndDelete = jest.fn();
  MockCategory.findByIdAndUpdate = jest.fn();
  return MockCategory;
});
jest.mock('../src/models/orderModel', () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../src/models/cartModel', () => {
  const MockCart = jest.fn();
  MockCart.findOne = jest.fn();
  MockCart.create = jest.fn();
  MockCart.findOneAndUpdate = jest.fn();
  return MockCart;
});
jest.mock('../src/models/couponModel', () => ({ findOne: jest.fn() }));
jest.mock('../src/models/webhookLog', () => ({
  create: jest.fn(),
  find: jest.fn(),
}));

const app = require('../src/app');
const User = require('../src/models/userModel');
const Product = require('../src/models/productModel');
const Category = require('../src/models/categoryModel');
const Order = require('../src/models/orderModel');
const Cart = require('../src/models/cartModel');

const VALID_ID = '507f1f77bcf86cd799439011';
const CATEGORY_ID = '507f1f77bcf86cd799439022';

const mockCategory = {
  _id: CATEGORY_ID,
  name: 'Supplements',
};

const mockProduct = {
  _id: VALID_ID,
  title: 'Whey Protein',
  slug: 'whey-protein',
  description: 'High quality protein',
  price: 500000,
  category: CATEGORY_ID,
  quantity: 50,
  discountPercentage: 10,
  images: [],
  ratings: [],
  totalrating: 0,
};

const mockUser = {
  _id: VALID_ID,
  id: VALID_ID,
  email: 'test@example.com',
  role: 'user',
  save: jest.fn().mockResolvedValue(true),
  isPasswordMatched: jest.fn().mockResolvedValue(true),
};

const adminUser = { ...mockUser, role: 'admin', email: 'admin@example.com' };

const genToken = (id = VALID_ID) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

describe('Product Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockResolvedValue(mockUser);
    User.findOne.mockResolvedValue(null);
    Order.findOne.mockResolvedValue(null);
    Cart.findOne.mockResolvedValue(null);
    Category.findById.mockResolvedValue(mockCategory);

    const mockExec = jest.fn().mockResolvedValue([mockProduct]);
    const mockPopulateChain = { exec: mockExec };
    Product.find.mockReturnValue({ populate: jest.fn().mockReturnValue(mockPopulateChain) });
    Product.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockProduct) });
    Product.create.mockResolvedValue(mockProduct);
    Product.findOneAndUpdate.mockResolvedValue(mockProduct);
    Product.findOneAndDelete.mockResolvedValue(mockProduct);
  });

  // ---------- GET /api/product ----------
  describe('GET /api/product', () => {
    it('returns all products', async () => {
      const res = await request(app).get('/api/product');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ---------- GET /api/product/:id ----------
  describe('GET /api/product/:id', () => {
    it('returns a single product by id', async () => {
      const res = await request(app).get(`/api/product/${VALID_ID}`);
      expect(res.status).toBe(200);
    });

    it('returns 500 for invalid MongoDB id', async () => {
      Product.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Cast error')),
      });

      const res = await request(app).get('/api/product/bad-id');
      expect(res.status).toBe(500);
    });
  });

  // ---------- POST /api/product ----------
  describe('POST /api/product', () => {
    it('creates a product with valid data', async () => {
      const res = await request(app)
        .post('/api/product')
        .send({
          title: 'Whey Protein',
          description: 'Great protein',
          price: 500000,
          category: CATEGORY_ID,
          quantity: 10,
        });

      expect(res.status).toBe(201);
    });

    it('returns 400 when category does not exist', async () => {
      Category.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/product')
        .send({
          title: 'Test Product',
          description: 'desc',
          price: 100,
          category: CATEGORY_ID,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid category');
    });

    it('returns 400 when product creation throws', async () => {
      Product.create.mockRejectedValue(new Error('Validation error'));

      const res = await request(app)
        .post('/api/product')
        .send({
          title: 'Bad Product',
          description: 'desc',
          price: 100,
          category: CATEGORY_ID,
        });

      expect(res.status).toBe(400);
    });
  });

  // ---------- PUT /api/product/:id ----------
  describe('PUT /api/product/:id', () => {
    it('updates a product by id', async () => {
      const res = await request(app)
        .put(`/api/product/${VALID_ID}`)
        .send({ title: 'Updated Protein', price: 600000 });

      expect(res.status).toBe(200);
    });
  });

  // ---------- DELETE /api/product/:id ----------
  describe('DELETE /api/product/:id', () => {
    it('deletes a product when not in orders or cart', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(adminUser);
      User.findOne.mockResolvedValue(adminUser);
      Order.findOne.mockResolvedValue(null);
      Cart.findOne.mockResolvedValue(null);
      Product.findOneAndDelete.mockResolvedValue(mockProduct);

      const res = await request(app)
        .delete(`/api/product/${VALID_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('returns 400 when product is in an active order', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(adminUser);
      User.findOne.mockResolvedValue(adminUser);
      Order.findOne.mockResolvedValue({ _id: 'order-id', orderStatus: 'Processing' });

      const res = await request(app)
        .delete(`/api/product/${VALID_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/đơn hàng/i);
    });

    it('returns 400 when product is in a cart', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(adminUser);
      User.findOne.mockResolvedValue(adminUser);
      Order.findOne.mockResolvedValue(null);
      Cart.findOne.mockResolvedValue({ _id: 'cart-id' });

      const res = await request(app)
        .delete(`/api/product/${VALID_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/giỏ hàng/i);
    });
  });

  // ---------- PUT /api/product/rating ----------
  describe('PUT /api/product/rating', () => {
    it('adds a new rating to a product', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(mockUser);

      const productWithRatings = {
        ...mockProduct,
        ratings: [],
      };
      Product.findById
        .mockResolvedValueOnce(productWithRatings)
        .mockResolvedValueOnce({ ...productWithRatings, ratings: [{ star: 4, postedBy: VALID_ID }] });
      Product.findByIdAndUpdate
        .mockResolvedValueOnce({ ...productWithRatings, ratings: [{ star: 4 }] })
        .mockResolvedValueOnce({ ...productWithRatings, totalrating: 4 });

      const res = await request(app)
        .put('/api/product/rating')
        .set('Authorization', `Bearer ${token}`)
        .send({ star: 4, prodID: VALID_ID, comment: 'Great product' });

      expect(res.status).toBe(200);
    });

    it('updates an existing rating', async () => {
      const token = genToken();
      User.findById.mockResolvedValue(mockUser);

      const existingRating = { star: 3, postedBy: VALID_ID, toString: () => VALID_ID };
      const productWithExistingRating = {
        ...mockProduct,
        ratings: [existingRating],
      };
      Product.findById
        .mockResolvedValueOnce(productWithExistingRating)
        .mockResolvedValueOnce({ ...productWithExistingRating, ratings: [{ star: 5 }] });
      Product.updateOne.mockResolvedValue({ nModified: 1 });
      Product.findByIdAndUpdate.mockResolvedValue({ ...productWithExistingRating, totalrating: 5 });

      const res = await request(app)
        .put('/api/product/rating')
        .set('Authorization', `Bearer ${token}`)
        .send({ star: 5, prodID: VALID_ID, comment: 'Even better' });

      expect(res.status).toBe(200);
    });
  });
});
