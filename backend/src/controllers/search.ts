import { Request, Response, NextFunction } from "express";
import { ElasticService } from "../services/elastic";

export class SearchController {
  constructor(private esService: ElasticService) {}

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 20)
      );
      const sort = (req.query.sort as string) || "relevance";
      const q = req.query.q as string | undefined;
      const category = req.query.category as string | undefined;
      const availability = req.query.availability as string | undefined;
      const minPrice = req.query.minPrice
        ? parseFloat(req.query.minPrice as string)
        : undefined;
      const maxPrice = req.query.maxPrice
        ? parseFloat(req.query.maxPrice as string)
        : undefined;

      const result = await this.esService.search({
        q,
        category,
        minPrice,
        maxPrice,
        availability,
        page,
        limit,
        sort,
      });

      const hits = (result as any).hits;
      const total =
        typeof hits.total === "number" ? hits.total : hits.total.value;
      const data = hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      }));

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

  suggest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query.q as string | undefined;

      if (!q || q.trim().length === 0) {
        res.json({ suggestions: [] });
        return;
      }

      const result = await this.esService.suggest(q.trim());
      const hits = (result as any).hits;
      const suggestions = hits.hits.map((hit: any) => ({
        id: hit._id,
        name: hit._source.name,
        category: hit._source.category,
      }));

      res.json({ suggestions });
    } catch (err) {
      next(err);
    }
  };
}
