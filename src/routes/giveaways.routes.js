import { Router } from "express";
import { check } from "express-validator";
import { createGiveaway, getGiveawayById, getGiveawayImages, getGiveaways, getTicketsByGiveawayId, updateGiveaway } from "../controllers/giveaways.controller.js";
import { validateJWT } from "../middlewares/validateJWT.js";

const router = Router();

router.post("/", validateJWT, createGiveaway);

router.get("/all/:status", getGiveaways);
router.get("/images/:id", getGiveawayImages)
router.get("/:id", getGiveawayById);
router.get("/tickets/:giveawayId", getTicketsByGiveawayId)
router.put("/:id", validateJWT, updateGiveaway);


export default router;
