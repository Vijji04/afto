import Stripe from "stripe";
import { StripeService } from "../src/services/stripe";

const mockStripe = {
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  accountLinks: {
    create: jest.fn(),
  },
} as unknown as Stripe;

describe("StripeService", () => {
  let service: StripeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StripeService(mockStripe);
  });

  describe("createConnectedAccount", () => {
    it("creates a custom account with correct controller properties and capabilities", async () => {
      const fakeAccount = {
        id: "acct_test_123",
        charges_enabled: false,
        payouts_enabled: false,
      };
      (mockStripe.accounts.create as jest.Mock).mockResolvedValue(fakeAccount);

      const result = await service.createConnectedAccount(
        "merchant@example.com",
        "Test Store"
      );

      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        type: "custom",
        country: "US",
        email: "merchant@example.com",
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: "Test Store",
          product_description: "Ecommerce products",
        },
        tos_acceptance: {
          service_agreement: "full",
        },
      });
      expect(result).toEqual(fakeAccount);
    });

    it("propagates Stripe errors", async () => {
      (mockStripe.accounts.create as jest.Mock).mockRejectedValue(
        new Error("Stripe error")
      );

      await expect(
        service.createConnectedAccount("bad@email.com", "Bad Store")
      ).rejects.toThrow("Stripe error");
    });
  });

  describe("createAccountLink", () => {
    it("creates an account link for onboarding", async () => {
      const fakeLink = {
        url: "https://connect.stripe.com/setup/s/test",
        expires_at: 1234567890,
      };
      (mockStripe.accountLinks.create as jest.Mock).mockResolvedValue(fakeLink);

      const result = await service.createAccountLink("acct_test_123");

      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: "acct_test_123",
        refresh_url: expect.stringContaining("/merchants/onboard/refresh"),
        return_url: expect.stringContaining("/merchants/onboard/complete"),
        type: "account_onboarding",
        collection_options: {
          fields: "eventually_due",
        },
      });
      expect(result).toEqual(fakeLink);
    });
  });

  describe("retrieveAccount", () => {
    it("retrieves account details", async () => {
      const fakeAccount = {
        id: "acct_test_123",
        charges_enabled: true,
        payouts_enabled: true,
        requirements: { currently_due: [] },
      };
      (mockStripe.accounts.retrieve as jest.Mock).mockResolvedValue(
        fakeAccount
      );

      const result = await service.retrieveAccount("acct_test_123");

      expect(mockStripe.accounts.retrieve).toHaveBeenCalledWith(
        "acct_test_123"
      );
      expect(result).toEqual(fakeAccount);
    });

    it("propagates errors on invalid account id", async () => {
      (mockStripe.accounts.retrieve as jest.Mock).mockRejectedValue(
        new Error("No such account")
      );

      await expect(
        service.retrieveAccount("acct_invalid")
      ).rejects.toThrow("No such account");
    });
  });
});
