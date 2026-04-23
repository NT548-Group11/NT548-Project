import cartReducer from '../../reducers/cart';

const initialState = { products: [], totalQuantity: 0 };

const mockProduct = { _id: 'prod-1', title: 'Whey Protein', price: 500000 };

describe('cartReducer', () => {
  it('returns the initial state for unknown action', () => {
    const state = cartReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  // SET_CART
  describe('SET_CART', () => {
    it('sets cart products and calculates totalQuantity', () => {
      const payload = {
        products: [
          { product: mockProduct, quantity: 2, selectedAttributes: {} },
          { product: { _id: 'prod-2', price: 100000 }, quantity: 3, selectedAttributes: {} },
        ],
      };
      const state = cartReducer(initialState, { type: 'SET_CART', payload });
      expect(state.products).toHaveLength(2);
      expect(state.totalQuantity).toBe(5);
    });

    it('handles empty cart', () => {
      const state = cartReducer(initialState, {
        type: 'SET_CART',
        payload: { products: [] },
      });
      expect(state.products).toHaveLength(0);
      expect(state.totalQuantity).toBe(0);
    });
  });

  // SET_TOTAL_QUANTITY
  describe('SET_TOTAL_QUANTITY', () => {
    it('updates totalQuantity in state', () => {
      const state = cartReducer(initialState, {
        type: 'SET_TOTAL_QUANTITY',
        payload: 10,
      });
      expect(state.totalQuantity).toBe(10);
    });
  });

  // ADD_TO_CART
  describe('ADD_TO_CART', () => {
    it('adds a new product to an empty cart', () => {
      const state = cartReducer(initialState, {
        type: 'ADD_TO_CART',
        payload: { product: mockProduct, selectedAttributes: {}, quantity: 1 },
      });
      expect(state.products).toHaveLength(1);
      expect(state.totalQuantity).toBe(1);
    });

    it('adds a second different product to the cart', () => {
      const existing = {
        products: [{ product: mockProduct, selectedAttributes: {}, quantity: 2 }],
        totalQuantity: 2,
      };
      const anotherProduct = { _id: 'prod-2', price: 200000 };
      const state = cartReducer(existing, {
        type: 'ADD_TO_CART',
        payload: { product: anotherProduct, selectedAttributes: {}, quantity: 1 },
      });
      expect(state.products).toHaveLength(2);
      expect(state.totalQuantity).toBe(3);
    });

    it('increments quantity when the same product with same attributes is added', () => {
      const existing = {
        products: [{ product: mockProduct, selectedAttributes: { size: 'L' }, quantity: 1 }],
        totalQuantity: 1,
      };
      const state = cartReducer(existing, {
        type: 'ADD_TO_CART',
        payload: { product: mockProduct, selectedAttributes: { size: 'L' }, quantity: 2 },
      });
      expect(state.products).toHaveLength(1);
      expect(state.products[0].quantity).toBe(3);
      expect(state.totalQuantity).toBe(3);
    });

    it('adds as new item when same product has different attributes', () => {
      const existing = {
        products: [{ product: mockProduct, selectedAttributes: { size: 'L' }, quantity: 1 }],
        totalQuantity: 1,
      };
      const state = cartReducer(existing, {
        type: 'ADD_TO_CART',
        payload: { product: mockProduct, selectedAttributes: { size: 'XL' }, quantity: 1 },
      });
      expect(state.products).toHaveLength(2);
      expect(state.totalQuantity).toBe(2);
    });
  });

  // REMOVE_FROM_CART
  describe('REMOVE_FROM_CART', () => {
    it('removes a product from the cart', () => {
      const existing = {
        products: [
          { product: mockProduct, selectedAttributes: {}, quantity: 2 },
          { product: { _id: 'prod-2' }, selectedAttributes: {}, quantity: 1 },
        ],
        totalQuantity: 3,
      };
      const state = cartReducer(existing, {
        type: 'REMOVE_FROM_CART',
        payload: { productId: 'prod-1', selectedAttributes: {} },
      });
      expect(state.products).toHaveLength(1);
      expect(state.totalQuantity).toBe(1);
    });

    it('keeps items with same product id but different attributes', () => {
      const existing = {
        products: [
          { product: mockProduct, selectedAttributes: { size: 'L' }, quantity: 1 },
          { product: mockProduct, selectedAttributes: { size: 'XL' }, quantity: 2 },
        ],
        totalQuantity: 3,
      };
      const state = cartReducer(existing, {
        type: 'REMOVE_FROM_CART',
        payload: { productId: 'prod-1', selectedAttributes: { size: 'L' } },
      });
      expect(state.products).toHaveLength(1);
      expect(state.products[0].selectedAttributes).toEqual({ size: 'XL' });
    });
  });

  // UPDATE_CART_ITEM
  describe('UPDATE_CART_ITEM', () => {
    it('updates the quantity of a cart item', () => {
      const existing = {
        products: [{ product: mockProduct, selectedAttributes: {}, quantity: 2 }],
        totalQuantity: 2,
      };
      const state = cartReducer(existing, {
        type: 'UPDATE_CART_ITEM',
        payload: { productId: 'prod-1', selectedAttributes: {}, quantity: 5 },
      });
      expect(state.products[0].quantity).toBe(5);
      expect(state.totalQuantity).toBe(5);
    });

    it('does not affect other items when updating one', () => {
      const existing = {
        products: [
          { product: mockProduct, selectedAttributes: {}, quantity: 2 },
          { product: { _id: 'prod-2' }, selectedAttributes: {}, quantity: 1 },
        ],
        totalQuantity: 3,
      };
      const state = cartReducer(existing, {
        type: 'UPDATE_CART_ITEM',
        payload: { productId: 'prod-1', selectedAttributes: {}, quantity: 10 },
      });
      expect(state.products[0].quantity).toBe(10);
      expect(state.products[1].quantity).toBe(1);
      expect(state.totalQuantity).toBe(11);
    });
  });

  // CLEAR_CART
  describe('CLEAR_CART', () => {
    it('empties the cart and resets totalQuantity to 0', () => {
      const existing = {
        products: [{ product: mockProduct, quantity: 3, selectedAttributes: {} }],
        totalQuantity: 3,
      };
      const state = cartReducer(existing, { type: 'CLEAR_CART' });
      expect(state.products).toHaveLength(0);
      expect(state.totalQuantity).toBe(0);
    });
  });
});
