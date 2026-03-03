import { Request, Response, NextFunction } from "express";
import { PostgresService } from "../services/postgres";

export class OrdersController {
  constructor(private pgService: PostgresService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, customerEmail, customerName } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res
          .status(400)
          .json({ error: "Items array is required and must not be empty" });
        return;
      }

      const order = await this.pgService.createOrder({
        items,
        customerEmail,
        customerName,
      });

      res.status(201).json({ data: order });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const order = await this.pgService.getOrderById(id);
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  };
}
