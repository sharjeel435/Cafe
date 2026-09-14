export type Dish = { id: string; name: string; description: string; category: string; price: number; minutes: number; rating: string; image: string; tag?: string; vegetarian?: boolean };
export const dishes: Dish[] = [
  { id: 'biryani', name: 'Chicken Biryani', description: 'Fragrant basmati, tender chicken & our signature spices.', category: 'Desi favorites', price: 250, minutes: 12, rating: '4.9', image: 'biryani', tag: 'Bestseller' },
  { id: 'burger', name: 'Crispy Zinger Burger', description: 'Golden crispy chicken, fresh lettuce & creamy house sauce.', category: 'Burgers', price: 380, minutes: 15, rating: '4.8', image: 'burger', tag: 'Student favorite' },
  { id: 'wrap', name: 'Chicken Paratha Roll', description: 'Smoky chicken wrapped in a warm, flaky paratha.', category: 'Rolls & wraps', price: 180, minutes: 8, rating: '4.7', image: 'wrap' },
  { id: 'sandwich', name: 'Classic Club Sandwich', description: 'Triple layers of chicken, egg & crisp seasonal greens.', category: 'Snacks', price: 320, minutes: 10, rating: '4.8', image: 'sandwich' },
  { id: 'fries', name: 'Golden French Fries', description: 'Perfectly crisp, lightly salted. Your favorite sidekick.', category: 'Snacks', price: 150, minutes: 6, rating: '4.6', image: 'fries', vegetarian: true },
  { id: 'chai', name: 'Karak Chai', description: 'Strong, slow-brewed tea. A little cup of campus comfort.', category: 'Drinks & chai', price: 80, minutes: 4, rating: '4.9', image: 'chai', tag: 'Campus classic', vegetarian: true },
  { id: 'veg-wrap', name: 'Garden Veggie Wrap', description: 'Crunchy vegetables, hummus & a bright herb dressing.', category: 'Rolls & wraps', price: 160, minutes: 7, rating: '4.7', image: 'wrap', vegetarian: true },
  { id: 'rice', name: 'Vegetable Pulao', description: 'Fluffy basmati rice with garden vegetables & whole spices.', category: 'Desi favorites', price: 180, minutes: 10, rating: '4.6', image: 'biryani', vegetarian: true },
  { id: 'cheeseburger', name: 'Double Cheese Burger', description: 'A hearty beef patty with melted cheese & tangy pickles.', category: 'Burgers', price: 420, minutes: 15, rating: '4.8', image: 'burger' },
  { id: 'loaded-fries', name: 'Loaded Masala Fries', description: 'Crispy fries with a spicy kick & creamy cheese sauce.', category: 'Snacks', price: 220, minutes: 8, rating: '4.7', image: 'fries', vegetarian: true },
  { id: 'coffee', name: 'Milky Coffee', description: 'Freshly brewed coffee for your next study session.', category: 'Drinks & chai', price: 140, minutes: 5, rating: '4.6', image: 'chai', vegetarian: true },
  { id: 'toast', name: 'Grilled Cheese Toast', description: 'Golden toasted bread with a generous melted cheese filling.', category: 'Snacks', price: 190, minutes: 7, rating: '4.7', image: 'sandwich', vegetarian: true },
];
export const categories = ['All items', 'Desi favorites', 'Burgers', 'Rolls & wraps', 'Snacks', 'Drinks & chai'];
export const money = (value: number) => `Rs. ${value.toLocaleString('en-PK')}`;
export type Order = { id: string; code: string; items: { id: string; quantity: number }[]; total: number; slot: string; payment: 'cash' | 'wallet'; status: 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled'; note: string; createdAt: string };
export type DemoState = { version: 1; cart: Record<string, number>; favorites: string[]; balance: number; orders: Order[]; unavailable: string[]; transactions: { id: string; label: string; amount: number }[]; name: string; open: boolean };
export function initialState(): DemoState { return { version: 1, cart: {}, favorites: [], balance: 2500, orders: [], unavailable: [], transactions: [{ id: 'welcome', label: 'Welcome demo credit', amount: 2500 }], name: 'Bilal', open: true }; }
export function cartTotal(cart: Record<string, number>): number { return dishes.reduce((sum, dish) => sum + dish.price * (cart[dish.id] || 0), 0); }
export function checkout(state: DemoState, options: { slot: string; payment: 'cash' | 'wallet'; note: string; id: string; code: string; createdAt: string }): DemoState {
  const items = Object.entries(state.cart).map(([id, quantity]) => ({ id, quantity }));
  if (!state.open) throw new Error('The cafeteria is paused. Please try again later.');
  if (!items.length) throw new Error('Add something delicious to your bag first.');
  if (items.some(item => !dishes.some(d => d.id === item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20 || state.unavailable.includes(item.id))) throw new Error('An item is unavailable or has an invalid quantity. Please update your bag.');
  if (!options.slot) throw new Error('Choose a pickup time.');
  const total = cartTotal(state.cart);
  if (options.payment === 'wallet' && total > state.balance) throw new Error('Not enough wallet credit. Add demo credit or pay at pickup.');
  const order: Order = { ...options, total, items, status: 'Confirmed' };
  return { ...state, cart: {}, orders: [order, ...state.orders], balance: state.balance - (options.payment === 'wallet' ? total : 0), transactions: options.payment === 'wallet' ? [{ id: options.id, label: `Order ${options.id}`, amount: -total }, ...state.transactions] : state.transactions };
}
export function cancelOrder(state: DemoState, id: string): DemoState {
  const order = state.orders.find(o => o.id === id);
  if (!order || order.status !== 'Confirmed') throw new Error('Only confirmed orders can be cancelled before preparation.');
  const refund = order.payment === 'wallet' ? order.total : 0;
  return { ...state, orders: state.orders.map(o => o.id === id ? { ...o, status: 'Cancelled' } : o), balance: state.balance + refund, transactions: refund ? [{ id: `refund-${id}`, label: `Refund for ${id}`, amount: refund }, ...state.transactions] : state.transactions };
}
export function readState(value: string | null): DemoState {
  if (!value) return initialState();
  try {
    const data = JSON.parse(value) as DemoState;
    if (data.version !== 1 || typeof data.name !== 'string' || typeof data.open !== 'boolean' || !Number.isFinite(data.balance) || data.balance < 0 || !data.cart || !Array.isArray(data.orders) || !Array.isArray(data.favorites) || !Array.isArray(data.unavailable) || !Array.isArray(data.transactions)) return initialState();
    if (Object.entries(data.cart).some(([id, qty]) => !dishes.some(d => d.id === id) || !Number.isInteger(qty) || qty < 1 || qty > 20)) return initialState();
    if (data.orders.some(o => !o || typeof o.id !== 'string' || !Array.isArray(o.items) || o.items.some(i => !dishes.some(d => d.id === i.id) || !Number.isInteger(i.quantity) || i.quantity < 1) || !Number.isFinite(o.total) || !['Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'].includes(o.status))) return initialState();
    return data;
  } catch { return initialState(); }
}
