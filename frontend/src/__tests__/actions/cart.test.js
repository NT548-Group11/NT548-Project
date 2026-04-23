import {
  addToCartAction,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  setCart,
} from '../../actions/cart';

describe('Cart Action Creators', () => {
  const mockProduct = { _id: 'prod-1', title: 'Protein', price: 300000 };
  const selectedAttributes = { flavor: 'Chocolate' };

  describe('addToCartAction', () => {
    it('creates ADD_TO_CART action with product, attributes and default quantity 1', () => {
      const action = addToCartAction(mockProduct, selectedAttributes);
      expect(action).toEqual({
        type: 'ADD_TO_CART',
        payload: { product: mockProduct, selectedAttributes, quantity: 1 },
      });
    });

    it('creates ADD_TO_CART action with custom quantity', () => {
      const action = addToCartAction(mockProduct, selectedAttributes, 3);
      expect(action.payload.quantity).toBe(3);
    });
  });

  describe('removeFromCart', () => {
    it('creates REMOVE_FROM_CART action', () => {
      const action = removeFromCart('prod-1', selectedAttributes);
      expect(action).toEqual({
        type: 'REMOVE_FROM_CART',
        payload: { productId: 'prod-1', selectedAttributes },
      });
    });
  });

  describe('updateCartItemQuantity', () => {
    it('creates UPDATE_CART_ITEM action', () => {
      const action = updateCartItemQuantity('prod-1', selectedAttributes, 5);
      expect(action).toEqual({
        type: 'UPDATE_CART_ITEM',
        payload: { productId: 'prod-1', selectedAttributes, quantity: 5 },
      });
    });
  });

  describe('clearCart', () => {
    it('creates CLEAR_CART action', () => {
      expect(clearCart()).toEqual({ type: 'CLEAR_CART' });
    });
  });

  describe('setCart', () => {
    it('creates SET_CART action with cart data', () => {
      const cartData = { products: [{ product: mockProduct, quantity: 2 }] };
      const action = setCart(cartData);
      expect(action).toEqual({
        type: 'SET_CART',
        payload: cartData,
      });
    });
  });
});
