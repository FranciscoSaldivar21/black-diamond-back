import { Router } from "express";
import { check } from "express-validator";
import { getGiveawayById, getGiveaways } from "../controllers/giveaways.controller.js";

const router = Router();

router.get("/:status", getGiveaways);
router.get("/:id", getGiveawayById);


export default router;
