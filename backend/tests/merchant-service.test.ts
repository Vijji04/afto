import { Pool } from "pg";
import { MerchantService } from "../src/services/merchant";

jest.mock("pg", () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe("MerchantService", () => {
  let service: MerchantService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    const pool = new Pool();
    mockPool = pool as unknown as { query: jest.Mock };
    service = new MerchantService(pool);
  });

  describe("create", () => {
    it("inserts a new merchant and returns it", async () => {
      const fakeMerchant = {
        id: "uuid-1",
        name: "Test Store",
        stripe_account_id: "acct_123",
        verification_status: "pending",
        charges_enabled: false,
        payouts_enabled: false,
        created_at: "2025-01-01T00:00:00.000Z",
      };
      mockPool.query.mockResolvedValueOnce({ rows: [fakeMerchant] });

      const result = await service.create("Test Store", "acct_123");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO merchants"),
        ["Test Store", "acct_123"]
      );
      expect(result).toEqual(fakeMerchant);
    });
  });

  describe("updateVerificationStatus", () => {
    it("updates verification_status, charges_enabled, and payouts_enabled", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.updateVerificationStatus("uuid-1", "verified", true, true);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE merchants"),
        ["verified", true, true, "uuid-1"]
      );
    });
  });

  describe("getById", () => {
    it("returns a merchant when found", async () => {
      const fakeMerchant = {
        id: "uuid-1",
        name: "Test Store",
        stripe_account_id: "acct_123",
      };
      mockPool.query.mockResolvedValueOnce({ rows: [fakeMerchant] });

      const result = await service.getById("uuid-1");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["uuid-1"]
      );
      expect(result).toEqual(fakeMerchant);
    });

    it("returns null when not found", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getByStripeAccountId", () => {
    it("returns a merchant by stripe_account_id", async () => {
      const fakeMerchant = {
        id: "uuid-1",
        name: "Test Store",
        stripe_account_id: "acct_123",
      };
      mockPool.query.mockResolvedValueOnce({ rows: [fakeMerchant] });

      const result = await service.getByStripeAccountId("acct_123");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("stripe_account_id"),
        ["acct_123"]
      );
      expect(result).toEqual(fakeMerchant);
    });

    it("returns null when not found", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getByStripeAccountId("acct_invalid");

      expect(result).toBeNull();
    });
  });

  describe("getAll", () => {
    it("returns all merchants", async () => {
      const fakeMerchants = [
        { id: "uuid-1", name: "Store A" },
        { id: "uuid-2", name: "Store B" },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: fakeMerchants });

      const result = await service.getAll();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT")
      );
      expect(result).toEqual(fakeMerchants);
    });
  });

  describe("assignMerchantsToProducts", () => {
    it("assigns merchant IDs to products that have none", async () => {
      const fakeMerchants = [
        { id: "m-1" },
        { id: "m-2" },
      ];
      const fakeProducts = [
        { id: "p-1" },
        { id: "p-2" },
        { id: "p-3" },
      ];
      mockPool.query
        .mockResolvedValueOnce({ rows: fakeMerchants })
        .mockResolvedValueOnce({ rows: fakeProducts })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE for p-1
        .mockResolvedValueOnce({ rows: [] }) // UPDATE for p-2
        .mockResolvedValueOnce({ rows: [] }); // UPDATE for p-3

      await service.assignMerchantsToProducts();

      expect(mockPool.query).toHaveBeenCalledTimes(5);
      // Each product should be updated with a merchant ID
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE products"),
        expect.arrayContaining(["p-1"])
      );
    });

    it("throws if no merchants exist", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.assignMerchantsToProducts()).rejects.toThrow(
        "No merchants found"
      );
    });
  });
});
