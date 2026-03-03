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

describe("GET /search/suggest", () => {
  let app: ReturnType<typeof createApp>;
  let mockEsClient: { search: jest.Mock };

  beforeEach(() => {
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockEsClient = esClient as unknown as { search: jest.Mock };
    app = createApp({ pool, esClient });
  });

  it("returns suggestions for a query", async () => {
    mockEsClient.search.mockResolvedValueOnce({
      hits: {
        total: { value: 2 },
        hits: [
          {
            _id: "123",
            _source: { name: "Aashirvaad Wheat", category: "Atta" },
          },
          {
            _id: "456",
            _source: { name: "Sher Wheat Atta", category: "Atta" },
          },
        ],
      },
    });

    const res = await request(app).get("/search/suggest?q=wheat");

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(2);
    expect(res.body.suggestions[0]).toEqual({
      id: "123",
      name: "Aashirvaad Wheat",
      category: "Atta",
    });
  });

  it("returns empty suggestions when q is missing", async () => {
    const res = await request(app).get("/search/suggest");

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toEqual([]);
  });

  it("returns 500 when elasticsearch fails", async () => {
    mockEsClient.search.mockRejectedValueOnce(new Error("ES down"));

    const res = await request(app).get("/search/suggest?q=wheat");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
