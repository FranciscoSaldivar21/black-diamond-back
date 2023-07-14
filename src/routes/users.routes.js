import { Router } from "express";
import { createUser, deleteUser, getUsers, getUserById, updateUser } from "../controllers/users.controller.js";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);

router.post("/", createUser);

router.delete("/:id", deleteUser);

//Utilizando put se actualiza todo, patch solo una parte del registro
router.patch("/:id", updateUser);

export default router;
