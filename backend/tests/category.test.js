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
jest.mock('../src/models/categoryModel', () => {
  const MockCategory = jest.fn();
  MockCategory.findById = jest.fn();
  MockCategory.find = jest.fn();
  MockCategory.create = jest.fn();
  MockCategory.findByIdAndDelete = jest.fn();
  MockCategory.findByIdAndUpdate = jest.fn();
  return MockCategory;
});
jest.mock('../src/models/productModel', () => {
  const MockProduct = jest.fn();
  MockProduct.findOne = jest.fn();
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
jest.mock('../src/models/cartModel', () => {
  const MockCart = jest.fn();
  MockCart.create = jest.fn();
  MockCart.findOne = jest.fn();
  MockCart.findOneAndUpdate = jest.fn();
  return MockCart;
});
jest.mock('../src/models/orderModel', () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../src/models/couponModel', () => ({ findOne: jest.fn() }));
jest.mock('../src/models/webhookLog', () => ({
  create: jest.fn(),
  find: jest.fn(),
}));

const app = require('../src/app');
const User = require('../src/models/userModel');
const Category = require('../src/models/categoryModel');
const Product = require('../src/models/productModel');

const VALID_ID = '507f1f77bcf86cd799439011';
const CATEGORY_ID = '507f1f77bcf86cd799439022';

const mockCategory = {
  _id: CATEGORY_ID,
  name: 'Supplements',
  attributes: [{ name: 'Flavor', values: ['Chocolate', 'Vanilla'] }],
};

const mockAdminUser = {
  _id: VALID_ID,
  id: VALID_ID,
  email: 'admin@example.com',
  role: 'admin',
  save: jest.fn().mockResolvedValue(true),
  isPasswordMatched: jest.fn().mockResolvedValue(true),
};

const genToken = (id = VALID_ID) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

describe('Category Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockResolvedValue(mockAdminUser);
    User.findOne.mockResolvedValue(mockAdminUser);
    Category.find.mockResolvedValue([mockCategory]);
    Category.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockCategory),
    });
    Category.create.mockResolvedValue(mockCategory);
    Category.findByIdAndDelete.mockResolvedValue(mockCategory);
    Category.findByIdAndUpdate.mockResolvedValue(mockCategory);
    Product.findOne.mockResolvedValue(null);
  });

  // ---------- GET /api/categories ----------
  describe('GET /api/categories', () => {
    it('returns all categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ---------- GET /api/categories/:id ----------
  describe('GET /api/categories/:id', () => {
    it('returns a category by id', async () => {
      Category.findById.mockResolvedValue(mockCategory);

      const res = await request(app).get(`/api/categories/${CATEGORY_ID}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when category not found', async () => {
      Category.findById.mockResolvedValue(null);

      const res = await request(app).get(`/api/categories/${CATEGORY_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Category not found');
    });
  });

  // ---------- GET /api/categories/:categoryId/attributes ----------
  describe('GET /api/categories/:categoryId/attributes', () => {
    it('returns attributes for a category', async () => {
      Category.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ attributes: mockCategory.attributes }),
      });

      const res = await request(app).get(`/api/categories/${CATEGORY_ID}/attributes`);
      expect(res.status).toBe(200);
    });

    it('returns 400 when category not found for attributes', async () => {
      Category.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app).get(`/api/categories/${CATEGORY_ID}/attributes`);
      expect(res.status).toBe(400);
    });
  });

  // ---------- POST /api/categories (admin) ----------
  describe('POST /api/categories', () => {
    it('creates a new category (admin)', async () => {
      const token = genToken();

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Supplements', attributes: [] });

      expect(res.status).toBe(201);
    });

    it('returns 400 when creation fails', async () => {
      const token = genToken();
      Category.create.mockRejectedValue(new Error('Duplicate key'));

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Supplements' });

      expect(res.status).toBe(400);
    });
  });

  // ---------- PUT /api/categories/:id (admin) ----------
  describe('PUT /api/categories/:id', () => {
    it('updates a category (admin)', async () => {
      const token = genToken();
      Category.findByIdAndUpdate.mockResolvedValue({ ...mockCategory, name: 'Updated' });

      const res = await request(app)
        .put(`/api/categories/${CATEGORY_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
    });
  });

  // ---------- DELETE /api/categories/:id (admin) ----------
  describe('DELETE /api/categories/:id', () => {
    it('deletes a category when no products are assigned to it', async () => {
      const token = genToken();
      Product.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/categories/${CATEGORY_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('returns 400 when products still exist in the category', async () => {
      const token = genToken();
      Product.findOne.mockResolvedValue({ _id: VALID_ID, category: CATEGORY_ID });

      const res = await request(app)
        .delete(`/api/categories/${CATEGORY_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/sản phẩm/i);
    });

    it('returns 500 when called without admin token', async () => {
      const regularUser = { ...mockAdminUser, role: 'user' };
      User.findById.mockResolvedValue(regularUser);
      User.findOne.mockResolvedValue(regularUser);

      const token = genToken();
      const res = await request(app)
        .delete(`/api/categories/${CATEGORY_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
    });
  });
});
