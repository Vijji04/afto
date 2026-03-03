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

describe("GET /merchants", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockPool = pool as unknown as { query: jest.Mock };
    app = createApp({ pool, esClient });
  });

  it("returns all merchants", async () => {
    const fakeMerchants = [
      {
        id: "uuid-1",
        name: "Store A",
        stripe_account_id: "acct_1",
        verification_status: "verified",
        charges_enabled: true,
        payouts_enabled: true,
      },
      {
        id: "uuid-2",
        name: "Store B",
        stripe_account_id: "acct_2",
        verification_status: "pending",
        charges_enabled: false,
        payouts_enabled: false,
      },
    ];
    mockPool.query.mockResolvedValueOnce({ rows: fakeMerchants });

    const res = await request(app).get("/merchants");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe("Store A");
  });

  it("returns 500 on database error", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("DB down"));

    const res = await request(app).get("/merchants");

    expect(res.status).toBe(500);
  });
});

describe("POST /merchants/:id/refresh-status", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: { query: jest.Mock };
  let mockStripeInstance: {
    accounts: { retrieve: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const pool = new Pool();
    const esClient = new Client({ node: "http://localhost:9200" });
    mockPool = pool as unknown as { query: jest.Mock };
    mockStripeInstance = new (Stripe as unknown as jest.Mock)() as unknown as {
      accounts: { retrieve: jest.Mock };
    };
    app = createApp({ pool, esClient });
  });

  it("retrieves account from Stripe and updates merchant status to verified", async () => {
    const fakeMerchant = {
      id: "uuid-1",
      name: "Store A",
      stripe_account_id: "acct_123",
      verification_status: "pending",
      charges_enabled: false,
      payouts_enabled: false,
    };

    mockPool.query
      .mockResolvedValueOnce({ rows: [fakeMerchant] }) // getById
      .mockResolvedValueOnce({ rows: [] }); // updateVerificationStatus

    mockStripeInstance.accounts.retrieve.mockResolvedValueOnce({
      id: "acct_123",
      charges_enabled: true,
      payouts_enabled: true,
      requirements: { currently_due: [], eventually_due: [] },
    });

    const res = await request(app).post("/merchants/uuid-1/refresh-status");

    expect(res.status).toBe(200);
    expect(res.body.data.verification_status).toBe("verified");
    expect(res.body.data.charges_enabled).toBe(true);
    expect(res.body.data.payouts_enabled).toBe(true);
  });

  it("sets status to restricted when charges_enabled is false", async () => {
    const fakeMerchant = {
      id: "uuid-1",
      name: "Store A",
      stripe_account_id: "acct_123",
      verification_status: "pending",
      charges_enabled: false,
      payouts_enabled: false,
    };

    mockPool.query
      .mockResolvedValueOnce({ rows: [fakeMerchant] })
      .mockResolvedValueOnce({ rows: [] });

    mockStripeInstance.accounts.retrieve.mockResolvedValueOnce({
      id: "acct_123",
      charges_enabled: false,
      payouts_enabled: false,
      requirements: { currently_due: ["external_account"], eventually_due: [] },
    });

    const res = await request(app).post("/merchants/uuid-1/refresh-status");

    expect(res.status).toBe(200);
    expect(res.body.data.verification_status).toBe("restricted");
  });

  it("returns 404 when merchant not found", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post(
      "/merchants/nonexistent/refresh-status"
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Merchant not found");
  });
});
