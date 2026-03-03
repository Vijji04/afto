export interface Product {
  id: string;
  name: string;
  description: string;
  price: number | string;
  currency: string;
  availability: string;
  images: string[];
  category_name?: string;
  subcategory_name?: string | null;
  merchant_name?: string | null;
  category?: string;
  subcategory?: string | null;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  total: string;
  amount?: string;
  currency?: string;
  platform_fee?: string;
  customer_email: string | null;
  customer_name: string | null;
  created_at: string;
  items: OrderItem[];
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Suggestion {
  id: string;
  name: string;
  category: string;
}

export interface CheckoutSession {
  sessionUrl: string;
  sessionId: string;
  orderId: string;
}
