import request from "supertest";
import { Pool } from "pg";
import { Client } from "@elastic/elasticsearch";
import { createApp } from "../src/app";

jest.mock("pg", () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

jest.mock("@elastic/elasticsearch", () => {
  const mockClient = { search: jest.fn() };
  return { Client: jest.fn(() => mockClient) as unknown };
});

const SAMPLE_PRODUCT_ROW = {
  id: "123",
  name: "Aashirvaad Whole Wheat",
  description: "Premium atta",
  price: "16.99",
  currency: "CAD",
  availability: "in_stock",
  images: ["https://cdn.example.com/img.jpg"],
  category_name: "Atta",
  subcategory_name: "Whole Wheat",
  total_count: "5",
};

describe("GET /products", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockPool = pool as unknown as { query: jest.Mock };
    app = createApp({ pool, esClient });
  });

  it("returns paginated products with defaults (page=1, limit=20)", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...SAMPLE_PRODUCT_ROW, total_count: "1" }],
    });

    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: "123",
      name: "Aashirvaad Whole Wheat",
      price: "16.99",
      category_name: "Atta",
    });
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it("accepts page and limit query params", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...SAMPLE_PRODUCT_ROW, total_count: "50" }],
    });

    const res = await request(app).get("/products?page=3&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
  });

  it("filters by category name", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...SAMPLE_PRODUCT_ROW, total_count: "1" }],
    });

    const res = await request(app).get("/products?category=Atta");

    expect(res.status).toBe(200);
    expect(res.body.data[0].category_name).toBe("Atta");

    const queryCall = mockPool.query.mock.calls[0];
    expect(queryCall[0]).toContain("c.name");
    expect(queryCall[1]).toContain("Atta");
  });

  it("filters by subcategory name", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...SAMPLE_PRODUCT_ROW, total_count: "1" }],
    });

    const res = await request(app).get(
      "/products?category=Atta&subcategory=Whole%20Wheat"
    );

    expect(res.status).toBe(200);
    const queryCall = mockPool.query.mock.calls[0];
    expect(queryCall[1]).toContain("Whole Wheat");
  });

  it("sorts by price ascending", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...SAMPLE_PRODUCT_ROW, total_count: "1" }],
    });

    const res = await request(app).get("/products?sort=price_asc");

    expect(res.status).toBe(200);
    const queryCall = mockPool.query.mock.calls[0];
    expect(queryCall[0]).toContain("p.price ASC");
  });

  it("sorts by price descending", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...SAMPLE_PRODUCT_ROW, total_count: "1" }],
    });

    const res = await request(app).get("/products?sort=price_desc");

    expect(res.status).toBe(200);
    const queryCall = mockPool.query.mock.calls[0];
    expect(queryCall[0]).toContain("p.price DESC");
  });

  it("returns empty data with correct pagination when no products match", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/products?category=NonExistent");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it("returns 500 on database error", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("DB down"));

    const res = await request(app).get("/products");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("GET /products/:id", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockPool = pool as unknown as { query: jest.Mock };
    app = createApp({ pool, esClient });
  });

  it("returns a single product by id", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "123",
          name: "Aashirvaad Whole Wheat",
          description: "Premium atta",
          price: "16.99",
          currency: "CAD",
          availability: "in_stock",
          images: ["https://cdn.example.com/img.jpg"],
          category_name: "Atta",
          subcategory_name: "Whole Wheat",
          merchant_name: null,
        },
      ],
    });

    const res = await request(app).get("/products/123");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: "123",
      name: "Aashirvaad Whole Wheat",
    });
  });

  it("returns 404 when product not found", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/products/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Product not found" });
  });

  it("returns 500 on database error", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("DB down"));

    const res = await request(app).get("/products/123");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
