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

const ES_HIT = {
  _id: "123",
  _source: {
    name: "Aashirvaad Whole Wheat",
    description: "Premium atta",
    price: 16.99,
    currency: "CAD",
    category: "Atta",
    subcategory: "Whole Wheat",
    availability: "in_stock",
    images: ["https://cdn.example.com/img.jpg"],
  },
};

describe("GET /search", () => {
  let app: ReturnType<typeof createApp>;
  let mockEsClient: { search: jest.Mock };

  beforeEach(() => {
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockEsClient = esClient as unknown as { search: jest.Mock };
    app = createApp({ pool, esClient });
  });

  it("returns results for a keyword search", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 1 },
        hits: [ES_HIT],
      },
    });

    const res = await request(app).get("/search?q=wheat");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: "123",
      name: "Aashirvaad Whole Wheat",
    });
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });

    const esCall = mockEsClient.search.mock.calls[0][0];
    expect(esCall.body.query.bool.must).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          multi_match: expect.objectContaining({
            query: "wheat",
          }),
        }),
      ])
    );
  });

  it("filters by category", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 1 },
        hits: [ES_HIT],
      },
    });

    const res = await request(app).get("/search?category=Atta");

    expect(res.status).toBe(200);

    const esCall = mockEsClient.search.mock.calls[0][0];
    expect(esCall.body.query.bool.filter).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ term: { category: "Atta" } }),
      ])
    );
  });

  it("filters by price range", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 1 },
        hits: [ES_HIT],
      },
    });

    const res = await request(app).get("/search?minPrice=5&maxPrice=20");

    expect(res.status).toBe(200);

    const esCall = mockEsClient.search.mock.calls[0][0];
    expect(esCall.body.query.bool.filter).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          range: { price: { gte: 5, lte: 20 } },
        }),
      ])
    );
  });

  it("filters by availability", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 1 },
        hits: [ES_HIT],
      },
    });

    const res = await request(app).get("/search?availability=in_stock");

    expect(res.status).toBe(200);

    const esCall = mockEsClient.search.mock.calls[0][0];
    expect(esCall.body.query.bool.filter).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ term: { availability: "in_stock" } }),
      ])
    );
  });

  it("sorts by price ascending", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 1 },
        hits: [ES_HIT],
      },
    });

    const res = await request(app).get("/search?q=wheat&sort=price_asc");

    expect(res.status).toBe(200);

    const esCall = mockEsClient.search.mock.calls[0][0];
    expect(esCall.body.sort).toEqual(
      expect.arrayContaining([{ price: { order: "asc" } }])
    );
  });

  it("sorts by price descending", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 1 },
        hits: [ES_HIT],
      },
    });

    const res = await request(app).get("/search?q=wheat&sort=price_desc");

    expect(res.status).toBe(200);

    const esCall = mockEsClient.search.mock.calls[0][0];
    expect(esCall.body.sort).toEqual(
      expect.arrayContaining([{ price: { order: "desc" } }])
    );
  });

  it("paginates correctly", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 50 },
        hits: [ES_HIT],
      },
    });

    const res = await request(app).get("/search?q=wheat&page=3&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 50,
      totalPages: 5,
    });

    const esCall = mockEsClient.search.mock.calls[0][0];
    expect(esCall.body.from).toBe(20);
    expect(esCall.body.size).toBe(10);
  });

  it("returns empty results when nothing matches", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 0 },
        hits: [],
      },
    });

    const res = await request(app).get("/search?q=xyznonexistent");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it("uses match_all when no query or filters provided", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 1 },
        hits: [ES_HIT],
      },
    });

    const res = await request(app).get("/search");

    expect(res.status).toBe(200);

    const esCall = mockEsClient.search.mock.calls[0][0];
    expect(esCall.body.query.bool.must).toEqual(
      expect.arrayContaining([{ match_all: {} }])
    );
  });

  it("returns 500 when elasticsearch fails", async () => {
    mockEsClient.search.mockRejectedValueOnce(
      new Error("ES connection refused")
    );

    const res = await request(app).get("/search?q=wheat");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
