import { Router } from "express";
import { getSaleById, getSales, insertSale, getAllSales, getBuyerByTicket } from "../controllers/sales.controller.js";
import { validateJWT } from "../middlewares/validateJWT.js";

const router = Router();

router.post("/create-checkout-session/:giveawayId/:userId",validateJWT, insertSale);
router.get("/getSaleById/:id", getSaleById);
router.get("/:userId", validateJWT, getSales);
router.get("/all/:page", getAllSales);
router.get("/buyer/:ticket/:giveaway_id", getBuyerByTicket);

export default router;  