# Afto — Bombay Grocers Platform

This is readme on the components that are built and also how to start the services.

- **`api/`** — Express 5 REST API (TypeScript, PostgreSQL + Elasticsearch)
- **`crawler/`** — Shopify scraper (TypeScript)
- **`ingestion_pipeline/`** — Dagster ETL pipeline (Python)
- **`frontend/`** — Next.js 14 ecommerce frontend (TypeScript, Tailwind, Zustand)

---

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL running locally
- Elasticsearch/OpenSearch running locally

---

## API Setup

```bash
cd api
npm install
cp .env.example .env   # set RDS_* and OPENSEARCH_HOST
npm run dev            # starts on http://localhost:3000
```

### API Endpoints

| Method | Path            | Description                                                  |
| ------ | --------------- | ------------------------------------------------------------ |
| GET    | `/`             | Top 20 most recently added products                          |
| GET    | `/products`     | Paginated products (`?category=&page=`)                      |
| GET    | `/products/:id` | Single product detail                                        |
| GET    | `/search`       | Elasticsearch full-text search (`?q=&category=&sort=&page=`) |
| GET    | `/checkout`     | Stub — returns 501                                           |

.env.example:
RDS_HOST=<localhost>
RDS_DB=<your-DB-name>
RDS_USER=<user-name>
RDS_PASSWORD=<your-password>

OPENSEARCH_HOST=<http://localhost:9200>
PORT=<PORT>

STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
FRONTEND_URL=http://localhost:3001

---

## Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                         # starts on http://localhost:3001
```

### Routes

| Path               | Description                              |
| ------------------ | ---------------------------------------- |
| `/`                | Home — editorial landing, top products   |
| `/category/[slug]` | Category product listing with pagination |
| `/product/[id]`    | Product detail                           |
| `/search`          | Full-text search with autocomplete       |
| `/cart`            | Cart page (Zustand, persisted locally)   |
| `/checkout`        | Checkout form (501 graceful handling)    |
| `/order-success`   | Post-order confirmation                  |

### Frontend Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom design tokens
- **Fonts:** Crimson Pro (serif headings) + Space Grotesk (sans body)
- **Components:** Atomic design — atoms / molecules / organisms / templates
- **State:** Zustand (cart, persisted to localStorage)
- **Tests:** Vitest + Testing Library (71 unit tests, TDD)

### Running Tests

```bash
cd frontend
npm test             # run all unit tests once
npm run test:watch   # watch mode
npm run test:coverage
```

---

## Crawler

```bash
cd crawler
npm install
npm run scrape   # outputs to crawler/output/products_canonical.json
```

---

## Ingestion Pipeline

```bash
pip install -r requirements.txt
cd ingestion_pipeline
dagster dev   # opens Dagster UI at http://localhost:3000 OR

```

Run the `afto_pipeline` job to load data from the crawler output into PostgreSQL and Elasticsearch.

---

## Environment Variables

### `api/.env`

```
RDS_HOST=localhost
RDS_DB=afto
RDS_USER=postgres
RDS_PASSWORD=yourpassword
OPENSEARCH_HOST=http://localhost:9200
PORT=3000
```

### `frontend/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Schema

TABLE categories (
id UUID PRIMARY KEY,
name TEXT UNIQUE NOT NULL,
created_at TIMESTAMP DEFAULT NOW()
);

TABLE subcategories (
id UUID PRIMARY KEY,
name TEXT NOT NULL,
category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
created_at TIMESTAMP DEFAULT NOW(),
UNIQUE(name, category_id)
);
TABLE merchants (
id UUID PRIMARY KEY,
name TEXT NOT NULL,
stripe_account_id TEXT UNIQUE,
verification_status TEXT DEFAULT 'pending',
created_at TIMESTAMP DEFAULT NOW(),
charges_enabled BOOLEAN DEFAULT false,
payouts_enabled BOOLEAN DEFAULT false,
updates_enabled BOOLEAN DEFAULT false
);

TABLE products (
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
description TEXT,
price NUMERIC(10,2) NOT NULL,
currency TEXT NOT NULL,
availability TEXT,
images TEXT[],
category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
created_at TIMESTAMP DEFAULT NOW()
);

TABLE orders (
id UUID
merchant_id
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

TABLE order_items (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
product_id TEXT NOT NULL REFERENCES products(id),
quantity INTEGER NOT NULL,
price_at_purchase NUMERIC(10,2) NOT NULL
);
