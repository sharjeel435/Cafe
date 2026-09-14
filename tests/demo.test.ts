import { describe, it, expect } from 'vitest';
import { initialState, checkout, cancelOrder, readState } from '../src/features/demo/data';
const options = { slot: '12:30 PM', payment: 'wallet' as const, note: '', id: 'CB-123', code: '1234', createdAt: '2026-09-15' };
describe('database-free demo ordering', () => {
  it('deducts the exact total and empties the bag', () => {
    const state = checkout({ ...initialState(), cart: { biryani: 2, chai: 1 } }, options);
    expect(state.balance).toBe(1920); expect(state.orders[0].total).toBe(580); expect(state.cart).toEqual({});
  });
  it('refunds a wallet cancellation exactly once', () => {
    const state = cancelOrder(checkout({ ...initialState(), cart: { biryani: 1 } }, options), options.id);
    expect(state.balance).toBe(2500); expect(() => cancelOrder(state, options.id)).toThrow();
  });
  it('keeps cash orders separate from wallet credit', () => {
    const state = checkout({ ...initialState(), cart: { burger: 1 } }, { ...options, payment: 'cash' });
    expect(state.balance).toBe(2500); expect(cancelOrder(state, options.id).balance).toBe(2500);
  });
  it('rejects empty, unavailable, invalid, and unaffordable orders', () => {
    expect(() => checkout(initialState(), options)).toThrow();
    expect(() => checkout({ ...initialState(), cart: { biryani: 1 }, unavailable: ['biryani'] }, options)).toThrow();
    expect(() => checkout({ ...initialState(), cart: { biryani: -1 } }, options)).toThrow();
    expect(() => checkout({ ...initialState(), cart: { burger: 20 } }, options)).toThrow();
  });
  it('recovers from malformed browser data', () => {
    expect(readState('{broken')).toEqual(initialState());
    expect(readState(JSON.stringify({ ...initialState(), cart: { unknown: 2 } }))).toEqual(initialState());
  });
});
