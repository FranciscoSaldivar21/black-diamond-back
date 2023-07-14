import { Router } from "express";

const router = Router();

router.all("/", (req, res) => {
    res.send("It works :)");
});

export default router;