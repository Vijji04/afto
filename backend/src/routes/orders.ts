import { Router } from "express";
import { OrdersController } from "../controllers/orders";

export function ordersRouter(controller: OrdersController): Router {
  const router = Router();
  router.post("/", controller.create);
  router.get("/:id", controller.getById);
  return router;
}
