// const express = require('express');
import express, { json } from "express";
import path from "path";
import { fileURLToPath } from "url";
import nodemon from "nodemon";
import cors from "cors";
import multer from "multer";
import { v4 } from "uuid";
import { config } from "dotenv";
import sales from "./routes/sales.routes.js";
import usersRoutes from "./routes/users.routes.js";
import indexRoutes from "./routes/index.routes.js";
import giveaways from "./routes/giveaways.routes.js";
import admin from "./routes/admin.routes.js";
import payment from "./routes/payment.routes.js";
import contact from "./routes/contact.routes.js";
import { SERVER_PORT } from './database/config.js';
import bodyParser from "body-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = SERVER_PORT || 3000;

const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public/uploads'),
    filename: (req, file, cb) => {
        cb(null, v4() + path.extname(file.originalname));
    }
})

const app = express();

app.use(
  bodyParser.json({
    // Because Stripe needs the raw body, we compute it but only when hitting the Stripe callback URL.
    verify: function (req, res, buf) {
      var url = req.originalUrl;
      if (url.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(multer({
    storage,
    dest: path.join(__dirname, 'public/uploads'),
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|webp|png|gif/;
        const mimetype = fileTypes.test(file.mimetype);
        const extName = fileTypes.test(path.extname(file.originalname));

        if(mimetype && extName)
            return cb(null, true);

        cb("Error: Debe de subir imagenes");
    }
}).array('images'));

//Muestra lo que hay en el servidor
app.use(express.static(path.join(__dirname, "public")));
app.use('/api', indexRoutes);
app.use('/api/users', usersRoutes);
app.use("/api/giveaway", giveaways);
app.use("/api/admin", admin);
app.use("/api/sales", sales);
app.use("/api/validatePayment", payment);
app.use("/api/contact", contact)




//Middleware para mostrar en caso de ruta no válida
// app.use((req, res) => {
//     res.status(404).json({
//         message: "endpoint not found"
//     })
// })

app.listen(PORT, "0.0.0.0");
console.log(`App running on port ${PORT}`);