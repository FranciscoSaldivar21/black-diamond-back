import express, { Router, json, request, response } from "express";
import nodemailer from "nodemailer";
import { body } from "express-validator";
import { pool } from "../database/db.js";

const router = Router();

router.post(
  "/:saleId", async (request, response) => {
    console.log(`El pago se completo`);
    const { saleId } = request.params;

    try {
      //Actualizar datos en tabla sales
      const resp = await pool.query(
        "UPDATE sales SET status = 1 WHERE id = ?", [saleId]
      );

      const [res] = await pool.query(
        "SELECT * FROM sales INNER JOIN user ON user_id = id_user WHERE id = ?",
        [saleId]
      );
      
      const [saleData] = res;
      
      const [boughtTickets] = await pool.query("SELECT ticket_number FROM ticket WHERE sale_id = ? AND STATUS = 1", [saleId]);

      const [giftTickets] = await pool.query("SELECT ticket_number FROM ticket WHERE sale_id = ? AND STATUS = 2", [saleId]);
  
      //Send email terminar
      let typeBenefic;
      if (saleData.benefic === 1)
        typeBenefic = "TIENES BENEFICIO BLACK DIAMOND GOLD POR COMPRAR EN LA PRIMERA SEMANA";
      else if (saleData.benefic === 2)
        typeBenefic = "TIENES BENEFICIO BLACK DIAMOND SILVER POR COMPRAR EN LA SEGUNDA SEMANA";
      else if (saleData.benefic === 3)
        typeBenefic = "TIENES BENEFICIO BLACK DIAMOND BRONZE POR COMPRAR EN LA TERCERA SEMANA";
  
      let plusBenefic = "";
      if(boughtTickets.length >= 10)
        plusBenefic = "TAMBIÉN TIENES BENEFICIO SUPER TRIPLE BLACK DIAMOND POR COMPRAR 10 BOLETOS O MÁS";
  
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
        to: saleData.user_email,
        subject: "Compra autorizada BDS",
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
                        <p class="mt-2 font-body text-lg"><strong>${boughtTickets.map(e => e.ticket_number + " ")}</strong></p>
                        <p class="mt-4 font-body text-lg">Boletos de regalo:</p>
                        <p class="mt-2 font-body text-lg"><strong>${giftTickets.map(e => e.ticket_number + " ")}</strong></p>
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
    } catch (error) {
      console.log(error);
      return response.sendStatus(400);
    }
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
