import { Router } from "express";
import { check } from "express-validator";
import { createGiveaway, getGiveawayById, getGiveawayImages, getGiveawayProgress, getGiveaways, getTicketByNumber, getTicketFree, getTicketsByGiveawayId, getTicketsContain, getTicketsEndtWith, getTicketsStartWith, initializeTickets, isTicketFree, updateGiveaway } from "../controllers/giveaways.controller.js";
import { validateJWT } from "../middlewares/validateJWT.js";

const router = Router();

router.post("/", validateJWT, createGiveaway);

router.get("/all/:status", getGiveaways);
router.get("/images/:id", getGiveawayImages)
router.get("/:id", getGiveawayById);
router.get("/tickets/:giveawayId/:offset", getTicketsByGiveawayId)
router.put("/:id", validateJWT, updateGiveaway);
router.get("/ticket/:giveawayId/:ticketNumber", getTicketByNumber);
router.get("/progress", getGiveawayProgress);
router.get("/getTicketsStartWith/:giveawayId/:startsWith", getTicketsStartWith);
router.get("/getTicketsEndtWith/:giveawayId/:endWith", getTicketsEndtWith);
router.get("/getTicketsContain/:giveawayId/:endWith", getTicketsContain);
router.get("/getTicketFree/:giveawayId", getTicketFree);
router.get("/initializeTickets/:giveawayId", initializeTickets);
router.get("/isTicketFree/:ticket/:giveawayId", isTicketFree);

export default router;
