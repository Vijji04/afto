ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updates_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  platform_fee NUMERIC(10,2),
  status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_at_purchase NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
