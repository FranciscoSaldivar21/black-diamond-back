// const express = require('express');
import express, { json } from "express";
import nodemon from "nodemon";
import cors from "cors";
import usersRoutes from "./routes/users.routes.js";
import indexRoutes from "./routes/index.routes.js";
import giveaways from "./routes/giveaways.routes.js";

import { SERVER_PORT } from './database/config.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', indexRoutes);
app.use('/api/users', usersRoutes);
app.use("/api/giveaways", giveaways);



//Middleware para mostrar en caso de ruta no válida
app.use((req, res) => {
    res.status(404).json({
        message: "endpoint not found"
    })
})

app.listen(SERVER_PORT);
console.log(`App running on port ${SERVER_PORT}`)