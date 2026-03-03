import request from "supertest";
import { Pool } from "pg";
import { Client } from "@elastic/elasticsearch";
import { createApp } from "../src/app";
import { CheckoutController } from "../src/controllers/checkout";

jest.mock("pg", () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(() => mockClient),
    end: jest.fn(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

jest.mock("@elastic/elasticsearch", () => {
  const mockClient = { search: jest.fn() };
  return { Client: jest.fn(() => mockClient) as unknown };
});

jest.mock("stripe", () => {
  const mockStripe = {
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
  };
  return jest.fn(() => mockStripe);
});

import Stripe from "stripe";

describe("calculatePlatformFee", () => {
  let controller: CheckoutController;

  beforeEach(() => {
    const pool = new Pool();
    controller = new CheckoutController(pool, {} as any);
  });

  it("returns 10% fee for totals above $100", () => {
    const result = controller.calculatePlatformFee(150);
    expect(result.feePercent).toBe(10);
    expect(result.feeAmount).toBe(15);
  });

  it("returns 15% fee for totals between $50 and $100", () => {
    const result = controller.calculatePlatformFee(80);
    expect(result.feePercent).toBe(15);
    expect(result.feeAmount).toBe(12);
  });

  it("returns 15% fee for exactly $50", () => {
    const result = controller.calculatePlatformFee(50);
    expect(result.feePercent).toBe(15);
    expect(result.feeAmount).toBe(7.5);
  });

  it("returns 15% fee for exactly $100", () => {
    const result = controller.calculatePlatformFee(100);
    expect(result.feePercent).toBe(15);
    expect(result.feeAmount).toBe(15);
  });

  it("returns 20% fee for totals below $50", () => {
    const result = controller.calculatePlatformFee(30);
    expect(result.feePercent).toBe(20);
    expect(result.feeAmount).toBe(6);
  });

  it("returns 10% fee for exactly $100.01", () => {
    const result = controller.calculatePlatformFee(100.01);
    expect(result.feePercent).toBe(10);
    expect(result.feeAmount).toBeCloseTo(10, 1);
  });
});

describe("POST /checkout/sessions", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: {
    query: jest.Mock;
    connect: jest.Mock;
  };
  let mockStripeInstance: {
    checkout: { sessions: { create: jest.Mock } };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockPool = pool as unknown as {
      query: jest.Mock;
      connect: jest.Mock;
    };
    mockStripeInstance = new (Stripe as unknown as jest.Mock)() as unknown as {
      checkout: { sessions: { create: jest.Mock } };
    };
    app = createApp({ pool, esClient });
  });

  it("creates a checkout session and returns sessionUrl and orderId", async () => {
    const mockClient = mockPool.connect();

    // pool.query for product lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: "prod-1", price: "25.00", merchant_id: "m-1" }],
    });
    // pool.query for merchant lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "m-1",
          stripe_account_id: "acct_test",
          charges_enabled: true,
        },
      ],
    });

    // client.query calls within transaction
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: "order-uuid-1" }],
      }) // INSERT order
      .mockResolvedValueOnce({ rows: [] }) // INSERT order_items
      .mockResolvedValueOnce({ rows: [] }) // UPDATE orders SET stripe_session_id
      .mockResolvedValueOnce(undefined); // COMMIT

    mockStripeInstance.checkout.sessions.create.mockResolvedValueOnce({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });

    const res = await request(app)
      .post("/checkout/sessions")
      .send({
        items: [{ productId: "prod-1", quantity: 2 }],
        customerEmail: "test@test.com",
        successUrl: "http://localhost:3001/order-success",
        cancelUrl: "http://localhost:3001/checkout",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sessionUrl).toBe(
      "https://checkout.stripe.com/pay/cs_test_123"
    );
    expect(res.body.data.orderId).toBe("order-uuid-1");
    expect(res.body.data.sessionId).toBe("cs_test_123");
  });

  it("returns 400 when items array is empty", async () => {
    const res = await request(app)
      .post("/checkout/sessions")
      .send({
        items: [],
        successUrl: "http://localhost:3001/success",
        cancelUrl: "http://localhost:3001/cancel",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Items array");
  });

  it("returns 400 when successUrl/cancelUrl missing", async () => {
    const res = await request(app)
      .post("/checkout/sessions")
      .send({
        items: [{ productId: "prod-1", quantity: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("successUrl and cancelUrl");
  });

  it("returns 422 when merchant charges are not enabled", async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ id: "prod-1", price: "25.00", merchant_id: "m-1" }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "m-1",
            stripe_account_id: "acct_test",
            charges_enabled: false,
          },
        ],
      });

    const res = await request(app)
      .post("/checkout/sessions")
      .send({
        items: [{ productId: "prod-1", quantity: 1 }],
        successUrl: "http://localhost:3001/success",
        cancelUrl: "http://localhost:3001/cancel",
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("not yet enabled for charges");
  });

  it("returns 422 when products span multiple merchants", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { id: "prod-1", price: "25.00", merchant_id: "m-1" },
        { id: "prod-2", price: "30.00", merchant_id: "m-2" },
      ],
    });

    const res = await request(app)
      .post("/checkout/sessions")
      .send({
        items: [
          { productId: "prod-1", quantity: 1 },
          { productId: "prod-2", quantity: 1 },
        ],
        successUrl: "http://localhost:3001/success",
        cancelUrl: "http://localhost:3001/cancel",
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("same merchant");
  });
});

describe("POST /checkout/confirm", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: { query: jest.Mock };
  let mockStripeInstance: {
    checkout: { sessions: { retrieve: jest.Mock } };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockPool = pool as unknown as { query: jest.Mock };
    mockStripeInstance = new (Stripe as unknown as jest.Mock)() as unknown as {
      checkout: { sessions: { retrieve: jest.Mock } };
    };
    app = createApp({ pool, esClient });
  });

  it("confirms a paid session and updates order status", async () => {
    mockStripeInstance.checkout.sessions.retrieve.mockResolvedValueOnce({
      id: "cs_test_123",
      payment_status: "paid",
      payment_intent: {
        id: "pi_test_456",
        status: "succeeded",
      },
    });

    mockPool.query
      .mockResolvedValueOnce({ rows: [] }) // UPDATE orders
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-uuid-1",
            status: "paid",
            amount: "50.00",
            currency: "usd",
            platform_fee: "10.00",
            stripe_session_id: "cs_test_123",
            stripe_payment_intent_id: "pi_test_456",
          },
        ],
      }); // SELECT orders

    const res = await request(app)
      .post("/checkout/confirm")
      .send({ sessionId: "cs_test_123" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("paid");
    expect(res.body.data.stripe_payment_intent_id).toBe("pi_test_456");
  });

  it("returns 400 when sessionId is missing", async () => {
    const res = await request(app).post("/checkout/confirm").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("sessionId is required");
  });

  it("returns 404 when order not found for session", async () => {
    mockStripeInstance.checkout.sessions.retrieve.mockResolvedValueOnce({
      id: "cs_nonexistent",
      payment_status: "paid",
      payment_intent: { id: "pi_test", status: "succeeded" },
    });

    mockPool.query
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [] }); // SELECT

    const res = await request(app)
      .post("/checkout/confirm")
      .send({ sessionId: "cs_nonexistent" });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("Order not found");
  });
});
