import { Client } from "@elastic/elasticsearch";
import { config } from "../config";

export const esClient = new Client({ node: config.es.node });

export interface SearchParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  page: number;
  limit: number;
  sort: string;
}

export class ElasticService {
  constructor(private client: Client) {}

  async search(params: SearchParams) {
    const { q, category, minPrice, maxPrice, availability, page, limit, sort } =
      params;

    const must: object[] = [];
    const filter: object[] = [];

    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ["name", "description"],
          fuzziness: "AUTO",
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    if (category) {
      filter.push({ term: { category } });
    }
    if (availability) {
      filter.push({ term: { availability } });
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      const range: Record<string, number> = {};
      if (minPrice !== undefined) range.gte = minPrice;
      if (maxPrice !== undefined) range.lte = maxPrice;
      filter.push({ range: { price: range } });
    }

    const sortClause: object[] = [];
    if (sort === "price_asc") {
      sortClause.push({ price: { order: "asc" } });
    } else if (sort === "price_desc") {
      sortClause.push({ price: { order: "desc" } });
    } else {
      sortClause.push({ _score: { order: "desc" } });
    }

    const from = (page - 1) * limit;

    const result = await this.client.search({
      index: "products",
      body: {
        query: { bool: { must, filter } },
        sort: sortClause as any,
        from,
        size: limit,
      },
    });

    return result;
  }

  async suggest(q: string) {
    const result = await this.client.search({
      index: "products",
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ["name", "description"],
            fuzziness: "AUTO",
          },
        },
        _source: ["name", "category"],
        size: 5,
      },
    });
    return result;
  }
}
