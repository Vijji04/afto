import { Router } from "express";
import { SearchController } from "../controllers/search";

export function searchRouter(controller: SearchController): Router {
  const router = Router();
  router.get("/suggest", controller.suggest);
  router.get("/", controller.search);
  return router;
}
