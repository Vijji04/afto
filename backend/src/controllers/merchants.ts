import { Request, Response, NextFunction } from "express";
import { MerchantService } from "../services/merchant";
import { StripeService } from "../services/stripe";

export class MerchantsController {
  constructor(
    private merchantService: MerchantService,
    private stripeService: StripeService
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const merchants = await this.merchantService.getAll();
      res.json({ data: merchants });
    } catch (err) {
      next(err);
    }
  };

  refreshStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const merchant = await this.merchantService.getById(id);
      if (!merchant) {
        res.status(404).json({ error: "Merchant not found" });
        return;
      }

      const account = await this.stripeService.retrieveAccount(
        merchant.stripe_account_id
      );

      const currentlyDue = account.requirements?.currently_due || [];
      let status: string;
      if (account.charges_enabled && account.payouts_enabled) {
        status = currentlyDue.length === 0 ? "verified" : "restricted";
      } else if (account.charges_enabled || account.payouts_enabled) {
        status = "restricted";
      } else {
        status = currentlyDue.length > 0 ? "restricted" : "pending";
      }

      await this.merchantService.updateVerificationStatus(
        id,
        status,
        account.charges_enabled,
        account.payouts_enabled
      );

      res.json({
        data: {
          id,
          verification_status: status,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          requirements_due: currentlyDue,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
