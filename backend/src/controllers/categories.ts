import { Request, Response, NextFunction } from "express";
import { PostgresService } from "../services/postgres";

export class CategoriesController {
  constructor(private pgService: PostgresService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.pgService.getCategories();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  };
}
