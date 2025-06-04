// Centralized constants for the application

export const ITEM_TYPES = [
  { value: 'chicken', label: 'Chicken' },
  { value: 'eeral', label: 'Eeral' },
  { value: 'leg-piece', label: 'Leg Piece' },
  { value: 'goat', label: 'Goat' },
  { value: 'kadai', label: 'Kadai' },
  { value: 'beef', label: 'Beef' },
  { value: 'kodal', label: 'Kodal' },
  { value: 'chops', label: 'Chops' },
  { value: 'boneless', label: 'Boneless' },
  { value: 'order', label: 'Order' }
] as const;

export const CUSTOMER_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'random', label: 'Random Customer' }
] as const;

export const PAYMENT_STATUS = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' }
] as const;

export const ORDER_STATUS = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' }
] as const;

export const TRANSACTION_TYPES = [
  { value: 'payment', label: 'Payment' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'expense', label: 'Expense' }
] as const;

export const ENTITY_TYPES = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'customer', label: 'Customer' }
] as const;