import { Router } from "express";
import { getSaleById, getSales, insertSale } from "../controllers/sales.controller.js";
import { validateJWT } from "../middlewares/validateJWT.js";

const router = Router();

router.post("/create-checkout-session/:giveawayId/:userId",validateJWT, insertSale);
router.get("/getSaleById/:id", validateJWT, getSaleById);
router.get("/:userId", validateJWT, getSales);


export default router;  