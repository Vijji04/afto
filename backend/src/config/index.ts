import dotenv from "dotenv";
import path from "path";

// Load root .env first, then backend/.env (overrides with Stripe keys for local dev)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

export const config = {
  pg: {
    host: process.env.RDS_HOST || "localhost",
    database: process.env.RDS_DB || "afto",
    user: process.env.RDS_USER || "postgres",
    password: process.env.RDS_PASSWORD || "password",
    port: parseInt(process.env.RDS_PORT || "5432", 10),
  },
  es: {
    node: process.env.OPENSEARCH_HOST || "http://localhost:9200",
  },
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  },
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:3001",
  },
};
