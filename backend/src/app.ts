import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Pool } from "pg";
import { Client } from "@elastic/elasticsearch";
import Stripe from "stripe";
import { PostgresService } from "./services/postgres";
import { ElasticService } from "./services/elastic";
import { StripeService } from "./services/stripe";
import { MerchantService } from "./services/merchant";
import { CategoriesController } from "./controllers/categories";
import { ProductsController } from "./controllers/products";
import { SearchController } from "./controllers/search";
import { OrdersController } from "./controllers/orders";
import { MerchantsController } from "./controllers/merchants";
import { CheckoutController } from "./controllers/checkout";
import { categoriesRouter } from "./routes/categories";
import { productsRouter } from "./routes/products";
import { searchRouter } from "./routes/search";
import { ordersRouter } from "./routes/orders";
import { merchantsRouter } from "./routes/merchants";
import { checkoutRouter } from "./routes/checkout";
import { config } from "./config";

export interface AppDeps {
  pool: Pool;
  esClient: Client;
}

export function createApp(deps: AppDeps) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const pgService = new PostgresService(deps.pool);
  const esService = new ElasticService(deps.esClient);

  const stripe = new Stripe(config.stripe.secretKey);
  const stripeService = new StripeService(stripe);
  const merchantService = new MerchantService(deps.pool);

  const categoriesCtrl = new CategoriesController(pgService);
  const productsCtrl = new ProductsController(pgService);
  const searchCtrl = new SearchController(esService);
  const ordersCtrl = new OrdersController(pgService);
  const merchantsCtrl = new MerchantsController(merchantService, stripeService);
  const checkoutCtrl = new CheckoutController(deps.pool, stripeService);

  app.use("/categories", categoriesRouter(categoriesCtrl));
  app.use("/products", productsRouter(productsCtrl));
  app.use("/search", searchRouter(searchCtrl));
  app.use("/orders", ordersRouter(ordersCtrl));
  app.use("/merchants", merchantsRouter(merchantsCtrl));
  app.use("/checkout", checkoutRouter(checkoutCtrl));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
