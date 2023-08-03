import { Router } from "express";
import { logIn, refreshToken } from "../controllers/admin.controller.js";
import { validateJWT } from "../middlewares/validateJWT.js";

const router = Router();

router.post("/auth", logIn);

//Validar y refrescar JWT
router.get("/renew", validateJWT, refreshToken);

export default router
