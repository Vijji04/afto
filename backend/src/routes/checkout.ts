import { Router } from "express";
import { CheckoutController } from "../controllers/checkout";

export function checkoutRouter(controller: CheckoutController): Router {
  const router = Router();
  router.post("/sessions", controller.createSession);
  router.post("/confirm", controller.confirmPayment);
  return router;
}
