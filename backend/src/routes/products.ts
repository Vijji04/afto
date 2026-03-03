import { Router } from "express";
import { ProductsController } from "../controllers/products";

export function productsRouter(controller: ProductsController): Router {
  const router = Router();
  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  return router;
}
