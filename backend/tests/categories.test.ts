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

describe("GET /categories", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockPool = pool as unknown as { query: jest.Mock };
    app = createApp({ pool, esClient });
  });

  it("returns 200 with categories and their subcategories", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "cat-1",
          name: "Atta",
          subcategories: [{ id: "sub-1", name: "Whole Wheat" }],
        },
        {
          id: "cat-2",
          name: "Rice",
          subcategories: [],
        },
      ],
    });

    const res = await request(app).get("/categories");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [
        {
          id: "cat-1",
          name: "Atta",
          subcategories: [{ id: "sub-1", name: "Whole Wheat" }],
        },
        {
          id: "cat-2",
          name: "Rice",
          subcategories: [],
        },
      ],
    });
  });

  it("returns 200 with empty array when no categories exist", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/categories");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });

  it("returns 500 when database query fails", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

    const res = await request(app).get("/categories");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
