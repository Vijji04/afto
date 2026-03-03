import { Pool } from "pg";
import { config } from "../config";

export const pool = new Pool(config.pg);

export class PostgresService {
  constructor(private pool: Pool) {}

  async getProducts(opts: {
    category?: string;
    subcategory?: string;
    page: number;
    limit: number;
    sort: string;
  }) {
    const { category, subcategory, page, limit, sort } = opts;
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`c.name = $${paramIdx++}`);
      params.push(category);
    }
    if (subcategory) {
      conditions.push(`s.name = $${paramIdx++}`);
      params.push(subcategory);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sortMap: Record<string, string> = {
      price_asc: "p.price ASC",
      price_desc: "p.price DESC",
      newest: "p.created_at DESC",
    };
    const orderBy = sortMap[sort] || "p.created_at DESC";

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const query = `
      SELECT
        p.id, p.name, p.description, p.price, p.currency,
        p.availability, p.images,
        c.name AS category_name,
        s.name AS subcategory_name,
        COUNT(*) OVER() AS total_count
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN subcategories s ON s.id = p.subcategory_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getProductById(id: string) {
    const result = await this.pool.query(
      `
      SELECT
        p.id, p.name, p.description, p.price, p.currency,
        p.availability, p.images,
        c.name AS category_name,
        s.name AS subcategory_name,
        m.name AS merchant_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN subcategories s ON s.id = p.subcategory_id
      LEFT JOIN merchants m ON m.id = p.merchant_id
      WHERE p.id = $1
    `,
      [id]
    );
    return result.rows[0] || null;
  }

  async createOrder(opts: {
    items: { productId: string; quantity: number }[];
    customerEmail?: string;
    customerName?: string;
  }) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const productIds = opts.items.map((i) => i.productId);
      const priceResult = await client.query(
        `SELECT id, price FROM products WHERE id = ANY($1)`,
        [productIds]
      );

      const priceMap = new Map<string, number>();
      for (const row of priceResult.rows) {
        priceMap.set(row.id, parseFloat(row.price));
      }

      let total = 0;
      for (const item of opts.items) {
        const price = priceMap.get(item.productId) || 0;
        total += price * item.quantity;
      }

      const orderResult = await client.query(
        `INSERT INTO orders (amount, customer_email, customer_name)
         VALUES ($1, $2, $3)
         RETURNING id, status, amount AS total, customer_email, customer_name, created_at`,
        [total.toFixed(2), opts.customerEmail || null, opts.customerName || null]
      );
      const order = orderResult.rows[0];

      const itemValues: string[] = [];
      const itemParams: (string | number)[] = [];
      let idx = 1;
      for (const item of opts.items) {
        const price = priceMap.get(item.productId) || 0;
        itemValues.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
        itemParams.push(order.id, item.productId, item.quantity, price.toFixed(2));
      }

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ${itemValues.join(", ")}`,
        itemParams
      );

      await client.query("COMMIT");

      return {
        ...order,
        items: opts.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          price_at_purchase: (priceMap.get(item.productId) || 0).toFixed(2),
        })),
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getOrderById(id: string) {
    const result = await this.pool.query(
      `SELECT
        o.id, o.status, o.amount AS total, o.amount, o.currency, o.platform_fee,
        o.customer_email, o.customer_name, o.created_at,
        o.stripe_session_id, o.stripe_payment_intent_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price_at_purchase', oi.price_at_purchase
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = $1
      GROUP BY o.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getCategories() {
    const result = await this.pool.query(`
      SELECT
        c.id,
        c.name,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS subcategories
      FROM categories c
      LEFT JOIN subcategories s ON s.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    return result.rows;
  }
}
