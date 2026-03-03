import Stripe from "stripe";
import { config } from "../config";

export class StripeService {
  constructor(private stripe: Stripe) {}

  async createConnectedAccount(
    email: string,
    businessName: string
  ): Promise<Stripe.Account> {
    return this.stripe.accounts.create({
      type: "custom",
      country: "US",
      email,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: businessName,
        product_description: "Ecommerce products",
      },
      tos_acceptance: {
        service_agreement: "full",
      },
    } as Stripe.AccountCreateParams);
  }

  async createAccountLink(accountId: string): Promise<Stripe.AccountLink> {
    const baseUrl = config.frontend?.url || "http://localhost:3001";
    return this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/merchants/onboard/refresh`,
      return_url: `${baseUrl}/merchants/onboard/complete`,
      type: "account_onboarding",
      collection_options: {
        fields: "eventually_due",
      },
    });
  }

  async retrieveAccount(accountId: string): Promise<Stripe.Account> {
    return this.stripe.accounts.retrieve(accountId);
  }

  async createCheckoutSession(
    opts: Stripe.Checkout.SessionCreateParams
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create(opts);
  }

  async retrieveCheckoutSession(
    sessionId: string
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
  }
}

export function createStripeClient(): Stripe {
  return new Stripe(config.stripe.secretKey);
}
