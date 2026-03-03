import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { StripeService } from "../services/stripe";
import { config } from "../config";

export class CheckoutController {
  constructor(
    private pool: Pool,
    private stripeService: StripeService
  ) {}

  calculatePlatformFee(total: number): {
    feePercent: number;
    feeAmount: number;
  } {
    let feePercent: number;
    if (total > 100) {
      feePercent = 10;
    } else if (total >= 50) {
      feePercent = 15;
    } else {
      feePercent = 20;
    }
    const feeAmount = Math.round(total * (feePercent / 100) * 100) / 100;
    return { feePercent, feeAmount };
  }

  createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, customerEmail, customerName, successUrl, cancelUrl } =
        req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res
          .status(400)
          .json({ error: "Items array is required and must not be empty" });
        return;
      }

      if (!successUrl || !cancelUrl) {
        res
          .status(400)
          .json({ error: "successUrl and cancelUrl are required" });
        return;
      }

      const productIds = items.map((i: { productId: string }) => i.productId);
      const priceResult = await this.pool.query(
        `SELECT id, price, merchant_id FROM products WHERE id = ANY($1)`,
        [productIds]
      );

      if (priceResult.rows.length === 0) {
        res.status(400).json({ error: "No valid products found" });
        return;
      }

      const merchantIds = new Set(
        priceResult.rows.map((r: { merchant_id: string }) => r.merchant_id).filter(Boolean)
      );

      if (merchantIds.size === 0) {
        res
          .status(422)
          .json({ error: "Products have no assigned merchant" });
        return;
      }

      if (merchantIds.size > 1) {
        res.status(422).json({
          error:
            "All products in a single checkout must belong to the same merchant",
        });
        return;
      }

      const merchantId = [...merchantIds][0];
      const merchantResult = await this.pool.query(
        `SELECT id, stripe_account_id, charges_enabled FROM merchants WHERE id = $1`,
        [merchantId]
      );
      const merchant = merchantResult.rows[0];

      if (!merchant) {
        res.status(422).json({ error: "Merchant not found" });
        return;
      }

      if (!merchant.charges_enabled) {
        res
          .status(422)
          .json({ error: "Merchant is not yet enabled for charges" });
        return;
      }

      const priceMap = new Map<string, number>();
      for (const row of priceResult.rows) {
        priceMap.set(row.id, parseFloat(row.price));
      }

      let total = 0;
      const lineItems: Array<{
        price_data: {
          currency: string;
          product_data: { name: string };
          unit_amount: number;
        };
        quantity: number;
      }> = [];

      for (const item of items) {
        const price = priceMap.get(item.productId);
        if (!price) continue;
        total += price * item.quantity;
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: { name: item.productId },
            unit_amount: Math.round(price * 100),
          },
          quantity: item.quantity,
        });
      }

      const { feeAmount } = this.calculatePlatformFee(total);
      const applicationFeeAmount = Math.round(feeAmount * 100);

      const client = await this.pool.connect();
      try {
        await client.query("BEGIN");

        const orderResult = await client.query(
          `INSERT INTO orders (merchant_id, amount, currency, platform_fee, status, customer_email, customer_name)
           VALUES ($1, $2, 'usd', $3, 'pending', $4, $5)
           RETURNING id`,
          [
            merchantId,
            total.toFixed(2),
            feeAmount.toFixed(2),
            customerEmail || null,
            customerName || null,
          ]
        );
        const orderId = orderResult.rows[0].id;

        const itemValues: string[] = [];
        const itemParams: (string | number)[] = [];
        let idx = 1;
        for (const item of items) {
          const price = priceMap.get(item.productId) || 0;
          itemValues.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
          itemParams.push(orderId, item.productId, item.quantity, price.toFixed(2));
        }

        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
           VALUES ${itemValues.join(", ")}`,
          itemParams
        );

        const session = await this.stripeService.createCheckoutSession({
          mode: "payment",
          line_items: lineItems,
          success_url: `${successUrl}?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
          payment_intent_data: {
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
              destination: merchant.stripe_account_id,
            },
          },
          ...(customerEmail ? { customer_email: customerEmail } : {}),
        });

        await client.query(
          `UPDATE orders SET stripe_session_id = $1 WHERE id = $2`,
          [session.id, orderId]
        );

        await client.query("COMMIT");

        res.json({
          data: {
            sessionUrl: session.url,
            sessionId: session.id,
            orderId,
          },
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      next(err);
    }
  };

  confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return;
      }

      const session = await this.stripeService.retrieveCheckoutSession(
        sessionId
      );

      const paymentIntent = session.payment_intent as { id: string; status: string } | null;
      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : paymentIntent?.id || null;
      const paymentStatus = paymentIntent?.status || session.payment_status;

      const orderStatus =
        paymentStatus === "succeeded" || session.payment_status === "paid"
          ? "paid"
          : "pending";

      await this.pool.query(
        `UPDATE orders SET stripe_payment_intent_id = $1, status = $2, updated_at = NOW()
         WHERE stripe_session_id = $3`,
        [paymentIntentId, orderStatus, sessionId]
      );

      const orderResult = await this.pool.query(
        `SELECT id, status, amount, currency, platform_fee, stripe_session_id, stripe_payment_intent_id
         FROM orders WHERE stripe_session_id = $1`,
        [sessionId]
      );

      if (orderResult.rows.length === 0) {
        res.status(404).json({ error: "Order not found for this session" });
        return;
      }

      res.json({ data: orderResult.rows[0] });
    } catch (err) {
      next(err);
    }
  };
}
