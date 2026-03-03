import request from "supertest";
import { Pool } from "pg";
import { Client } from "@elastic/elasticsearch";
import { createApp } from "../src/app";

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

describe("POST /orders", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: { query: jest.Mock; connect: jest.Mock };

  beforeEach(() => {
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockPool = pool as unknown as { query: jest.Mock; connect: jest.Mock };
    app = createApp({ pool, esClient });
  });

  it("creates an order and returns 201 with order data", async () => {
    const mockClient = mockPool.connect();
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          { id: "prod-1", price: "16.99" },
          { id: "prod-2", price: "5.49" },
        ],
      }) // product price lookup
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-uuid-1",
            status: "pending",
            total: "27.97",
            customer_email: "test@test.com",
            customer_name: "Test User",
            created_at: "2025-01-01T00:00:00.000Z",
          },
        ],
      }) // INSERT order
      .mockResolvedValueOnce({ rows: [] }) // INSERT order_items
      .mockResolvedValueOnce(undefined); // COMMIT

    const res = await request(app)
      .post("/orders")
      .send({
        items: [
          { productId: "prod-1", quantity: 1 },
          { productId: "prod-2", quantity: 2 },
        ],
        customerEmail: "test@test.com",
        customerName: "Test User",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: "order-uuid-1",
      status: "pending",
      total: "27.97",
    });
  });

  it("returns 400 when items array is empty", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ items: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Items array is required and must not be empty" });
  });

  it("returns 400 when items is missing", async () => {
    const res = await request(app)
      .post("/orders")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Items array is required and must not be empty" });
  });

  it("returns 500 on database error", async () => {
    const mockClient = mockPool.connect();
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error("DB down")); // product lookup fails
    mockClient.query.mockResolvedValueOnce(undefined); // ROLLBACK

    const res = await request(app)
      .post("/orders")
      .send({
        items: [{ productId: "prod-1", quantity: 1 }],
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("GET /orders/:id", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockPool = pool as unknown as { query: jest.Mock };
    app = createApp({ pool, esClient });
  });

  it("returns order with items", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "order-uuid-1",
          status: "pending",
          total: "27.97",
          customer_email: "test@test.com",
          customer_name: "Test User",
          created_at: "2025-01-01T00:00:00.000Z",
          items: [
            {
              id: "item-1",
              product_id: "prod-1",
              product_name: "Wheat Flour",
              quantity: 1,
              price_at_purchase: "16.99",
            },
          ],
        },
      ],
    });

    const res = await request(app).get("/orders/order-uuid-1");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: "order-uuid-1",
      status: "pending",
      total: "27.97",
    });
    expect(res.body.data.items).toHaveLength(1);
  });

  it("returns 404 when order not found", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/orders/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Order not found" });
  });

  it("returns 500 on database error", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("DB down"));

    const res = await request(app).get("/orders/order-uuid-1");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
