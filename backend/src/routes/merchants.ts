import { Router } from "express";
import { MerchantsController } from "../controllers/merchants";

export function merchantsRouter(controller: MerchantsController): Router {
  const router = Router();
  router.get("/", controller.getAll);
  router.post("/:id/refresh-status", controller.refreshStatus);
  return router;
}
