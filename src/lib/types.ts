export type Pallet = {
  id: string;
  user_id: string;
  source: string;
  purchase_date: string;
  cost: number;
  freight: number;
  notes: string;
  created_at: string;
};

export type Item = {
  id: string;
  user_id: string;
  pallet_id: string;
  name: string;
  category: string;
  condition: string;
  est_value: number;
  note: string;
  status: "in_stock" | "sold";
  created_at: string;
};

export type Sale = {
  id: string;
  user_id: string;
  item_id: string;
  sale_date: string;
  price: number;
  buyer: string;
  channel: string;
  payment: string;
  note: string;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  expense_date: string;
  category: string;
  amount: number;
  note: string;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  trial_end: string | null;
};

export const CATEGORIES = [
  "Electronics",
  "Home & Kitchen",
  "Tools & Hardware",
  "Toys & Games",
  "Clothing & Accessories",
  "Furniture & Decor",
  "Health & Beauty",
  "Sporting Goods",
  "Office & Craft",
  "Other",
];

export const CONDITIONS = ["New", "Like New", "Good", "Fair", "Damaged / Parts"];

export const CHANNELS = [
  "Facebook Marketplace",
  "OfferUp",
  "eBay",
  "In-Person / Cash",
  "Flea Market / Booth",
  "Nextdoor",
  "Other",
];

export const PAYMENTS = ["Cash", "Venmo", "Cash App", "PayPal", "Zelle", "Card", "Other"];

export const EXPENSE_CATS = [
  "Pickup / Freight",
  "Storage",
  "Packaging / Supplies",
  "Listing / Platform Fees",
  "Mileage / Gas",
  "Booth Rent",
  "Other",
];

export const ACTIVE_STATUSES = new Set(["active", "trialing"]);
