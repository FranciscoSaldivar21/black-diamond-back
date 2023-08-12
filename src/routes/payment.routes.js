import express, { Router, json, request, response } from "express";
import nodemailer from "nodemailer";
import { body } from "express-validator";
import Stripe from "stripe";
import { pool } from "../database/db.js";

const stripe = new Stripe(process.env.PUBLIC_STRIPE_KEY);

const router = Router();

// webhook route
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const event = request.body;
    const { type, data } = event;
    const { giveawayId, userId, ticketPrice, saleId: idVenta, email } = data.object.metadata;

    switch (type) {
      case "payment_intent.succeeded":
        console.log(`El intento de pago fue exitoso ${type}`);
        break;
      case "payment_intent.canceled":
        console.log(`Pago cancelado por el usuario ${type}`);
        break;
      case "payment_intent.payment_failed":
        console.log(`El pago falló ${type}`);
        break;
      case "checkout.session.expired":
        //Eliminar datos aquí y en el cancel
        console.log(`La sesión del pago expiró ${type}`);

        console.log(data);
        const { saleId } = data.object.metadata;
        try {
          const result = await pool.query(
            "DELETE FROM ticket WHERE sale_id = ?",
            [saleId]
          );

          const res = await pool.query("DELETE FROM sales WHERE id = ?", [
            saleId,
          ]);
          console.log(res);
        } catch (error) {
          console.log(error);
        }
        break;
      case "checkout.session.completed":
        console.log(`El pago se completó ${type}`);
        //Actualizar datos en tabla sales
        const [res] = await pool.query(
          "UPDATE sales set status = 1, idStripe = ?",
          [data.object.id]
        );

        //Extraer tickets de regalo
        let limit = 0;
        let giftTickets = [];
        const tickets = data.object.metadata.tickets.split(",").length;
        if (tickets > 1){
          if (tickets > 2 && tickets < 5) limit = 7;
          if (tickets >= 5 && tickets < 8) limit = 15;
          if (tickets >= 8 && tickets < 10) limit = 22;
          if (tickets >= 10) limit = 30;

          while (giftTickets.length < limit) {
            const number = Math.floor(Math.random() * (99999 - 33333)) + 33333;
            const [rows] = await pool.query(
              "SELECT ticket_number FROM ticket WHERE ticket_number = ?",
              [number]
            );
            if (rows.length > 0) continue;
  
            giftTickets.push(number);
          }

          for (let i = 0; i < giftTickets.length; i++) {
            const giftTicketsInsertion = await pool.query(
              "INSERT INTO ticket VALUES (0, ?, ?, ?, ?, ?, 2)",
              [giveawayId, giftTickets[i], userId, ticketPrice, idVenta] //1 comprado, 2 regalado.
            );
          }
        }


        let typeBenefic;
        if (data.object.metadata.giveawayBenefic === "1")
          typeBenefic =
            "TIENES BENEFICIO BLACK DIAMOND GOLD POR COMPRAR EN LA PRIMERA SEMANA";
        else if (data.object.metadata.giveawayBenefic === "2")
          typeBenefic =
            "TIENES BENEFICIO BLACK DIAMOND SILVER POR COMPRAR EN LA SEGUNDA SEMANA";
        else if (data.object.metadata.giveawayBenefic === "3")
          typeBenefic =
            "TIENES BENEFICIO BLACK DIAMOND BRONZE POR COMPRAR EN LA TERCERA SEMANA";

        let plusBenefic = "";
        if(data.object.metadata.tickets.split(",").length >= 10)
          plusBenefic = "TAMBIÉN TIENES BENEFICIO SUPER TRIPLE BLACK DIAMOND POR COMPRAR 10 BOLETOS O MÁS";
        //Send email
        const config = {
          host: "smtp.gmail.com",
          port: 587,
          auth: {
            user: "blackdiamondsorteos@gmail.com",
            pass: "kycjnlqvzifzmgey",
          },
        };

        const message = {
          from: "blackdiamondsorteos@gmail.com",
          to: email,
          subject: "Tu compra en BLACK DIAMOND SORTEOS",
          html: `<!DOCTYPE html>
          <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                  <link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300&family=Roboto:wght@300&display=swap" rel="stylesheet">
                  <script src="https://cdn.tailwindcss.com"></script>
                  <script>
                      tailwind.config = {
                          theme: {
                              extend: {
                                  fontFamily: {
                                      body: ['roboto', 'sans-serif'],
                                      title: ['Gothic A1', 'sans-serif']
                                  },
                              }
                          }
                      }
                  </script>
              </head>
              <body class="w-full">
                  <div class="w-11/12 mx-auto mt-6">
                      <div>
                          <h1 class="text-3xl font-bold uppercase text-center font-title">
                              BLACK DIAMOND SORTEOS
                          </h1>
                          <p class="mt-4 font-body text-lg uppercase">Gracias por tu compra.</p>
                          <p class="mt-6 font-body text-lg">Te hacemos envío del detalle de tu compra.</p>
                      </div>
                      <div class="h-40">
                          <p class="mt-4 font-body text-lg uppercase font-semibold">${typeBenefic}</p>
                          <p class="mt-4 font-body text-lg uppercase font-semibold">${plusBenefic}</p>
                          <p class="mt-4 font-body text-lg">Boletos comprados:</p>
                          <p class="mt-2 font-body text-lg"><strong>${data.object.metadata.tickets.split(",").map((e) => e + " ")}</strong></p>
                          <p class="mt-4 font-body text-lg">Boletos de regalo:</p>
                          <p class="mt-2 font-body text-lg"><strong>${giftTickets.map((e) => e + " ")}</strong></p>
                      </div>
                      <div class="mt-10">
                          <p class="font-body text-lg">Te recomendamos conservar este correo para futuras aclaraciones.</p>
                          <p class="font-body text-lg">De igual manera puedes revisarlo en nuestra pagina iniciando sesión con tu cuenta y yendo a la pestaña de "MIS COMPRAS".</p>
                          <div class="flex flex-row justify-center align-middle items-center mt-10">
                              <div>
                                  <p class="font-body text-center text-lg">Si tienes alguna duda puedes comunicarte al correo: </p>
                                  <p class="font-body text-center font-bold italic text-lg">blackdiamondsorteos@gmail.com</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </body>
          </html>`,
        };

        const transport = nodemailer.createTransport(config);
        const info = await transport.sendMail(message);

        return response.sendStatus(200);
        break;
      default:
        console.log(`Evento desconocido ${type}`);
        console.log(data.object);
    }
    response.status(200);
  }
);

router.get(
  "/cancel/:giveawayId/:saleId",
  express.raw({ type: "application/json" }),
  async (request = request, response = response) => {
    //Eliminar datos de la compra
    console.log("Se canceló la compra");
    const { giveawayId, saleId } = request.params;

    try {
      const result = await pool.query("DELETE FROM ticket WHERE sale_id = ?", [
        saleId,
      ]);

      const res = await pool.query("DELETE FROM sales WHERE id = ?", [saleId]);
    } catch (error) {
      console.log(error);
    }

    return response.redirect(`http://localhost:5173/giveaway/${giveawayId}`);
  }
);

export default router;
