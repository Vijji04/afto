import { Request, Response, NextFunction } from "express";
import { PostgresService } from "../services/postgres";

export class ProductsController {
  constructor(private pgService: PostgresService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 20)
      );
      const sort = (req.query.sort as string) || "newest";
      const category = req.query.category as string | undefined;
      const subcategory = req.query.subcategory as string | undefined;

      const rows = await this.pgService.getProducts({
        category,
        subcategory,
        page,
        limit,
        sort,
      });

      const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
      const data = rows.map(({ total_count, ...rest }: any) => rest);

      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: total > 0 ? Math.ceil(total / limit) : 0,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const product = await this.pgService.getProductById(id);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json({ data: product });
    } catch (err) {
      next(err);
    }
  };
}
