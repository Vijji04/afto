import { Pool } from "pg";

export interface Merchant {
  id: string;
  name: string;
  stripe_account_id: string;
  verification_status: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  updates_enabled: boolean;
  created_at: string;
}

export class MerchantService {
  constructor(private pool: Pool) {}

  async create(name: string, stripeAccountId: string): Promise<Merchant> {
    const result = await this.pool.query(
      `INSERT INTO merchants (id, name, stripe_account_id)
       VALUES (gen_random_uuid(), $1, $2)
       RETURNING *`,
      [name, stripeAccountId]
    );
    return result.rows[0];
  }

  async updateVerificationStatus(
    id: string,
    status: string,
    chargesEnabled: boolean,
    payoutsEnabled: boolean
  ): Promise<void> {
    await this.pool.query(
      `UPDATE merchants
       SET verification_status = $1, charges_enabled = $2, payouts_enabled = $3, updated_at = NOW()
       WHERE id = $4`,
      [status, chargesEnabled, payoutsEnabled, id]
    );
  }

  async getById(id: string): Promise<Merchant | null> {
    const result = await this.pool.query(
      `SELECT * FROM merchants WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getByStripeAccountId(stripeAccountId: string): Promise<Merchant | null> {
    const result = await this.pool.query(
      `SELECT * FROM merchants WHERE stripe_account_id = $1`,
      [stripeAccountId]
    );
    return result.rows[0] || null;
  }

  async getAll(): Promise<Merchant[]> {
    const result = await this.pool.query(
      `SELECT * FROM merchants ORDER BY created_at`
    );
    return result.rows;
  }

  async assignMerchantsToProducts(): Promise<void> {
    const merchantResult = await this.pool.query(
      `SELECT id FROM merchants ORDER BY created_at`
    );
    const merchants = merchantResult.rows;
    if (merchants.length === 0) {
      throw new Error("No merchants found");
    }

    const productResult = await this.pool.query(
      `SELECT id FROM products WHERE merchant_id IS NULL`
    );
    const products = productResult.rows;

    for (let i = 0; i < products.length; i++) {
      const merchantId = merchants[i % merchants.length].id;
      await this.pool.query(
        `UPDATE products SET merchant_id = $1 WHERE id = $2`,
        [merchantId, products[i].id]
      );
    }
  }
}
