import { Pool } from "pg";
import Stripe from "stripe";
import { config } from "../config";
import { StripeService } from "../services/stripe";
import { MerchantService } from "../services/merchant";

const MERCHANTS = [
  { name: "Green Harvest Market", email: "green.harvest@example.com" },
  { name: "Artisan Pantry Co", email: "artisan.pantry@example.com" },
  { name: "Spice Route Trading", email: "spice.route@example.com" },
  { name: "Mountain Valley Foods", email: "mountain.valley@example.com" },
  { name: "Coastal Organics", email: "coastal.organics@example.com" },
  { name: "Heritage Grains Ltd", email: "heritage.grains@example.com" },
];

async function main() {
  const pool = new Pool(config.pg);
  const stripe = new Stripe(config.stripe.secretKey);
  const stripeService = new StripeService(stripe);
  const merchantService = new MerchantService(pool);

  console.log("Starting merchant onboarding...\n");

  for (const { name, email } of MERCHANTS) {
    try {
      const existing = await pool.query(
        `SELECT id FROM merchants WHERE name = $1`,
        [name]
      );
      if (existing.rows.length > 0) {
        console.log(`[SKIP] "${name}" already exists in DB`);
        continue;
      }

      console.log(`Creating Stripe account for "${name}" (${email})...`);
      const account = await stripeService.createConnectedAccount(email, name);
      console.log(`  Stripe account: ${account.id}`);

      const merchant = await merchantService.create(name, account.id);
      console.log(`  DB merchant ID: ${merchant.id}`);

      const link = await stripeService.createAccountLink(account.id);
      console.log(`  Onboarding URL: ${link.url}\n`);
    } catch (err) {
      console.error(`[ERROR] Failed to onboard "${name}":`, err);
    }
  }

  console.log("\nAssigning merchants to products...");
  try {
    await merchantService.assignMerchantsToProducts();
    console.log("Done! Merchants assigned to products.\n");
  } catch (err) {
    console.error("Failed to assign merchants to products:", err);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
