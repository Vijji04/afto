import { Router } from "express";
import { CategoriesController } from "../controllers/categories";

export function categoriesRouter(controller: CategoriesController): Router {
  const router = Router();
  router.get("/", controller.getAll);
  return router;
}
