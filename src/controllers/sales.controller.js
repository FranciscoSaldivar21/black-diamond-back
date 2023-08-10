import e, { request, response } from "express";
import Stripe from "stripe";
import { pool } from "../database/db.js";

const stripe = new Stripe(process.env.PUBLIC_STRIPE_KEY);

export const insertSale = async (req = request, res = response) => {
  const { giveawayId, userId } = req.params;
  const { tickets, ticketPrice, giveawayBenefic, userEmail } = req.body;

  try {
    //Evitar que se vendan boletos dos veces
    for (let i = 0; i < tickets.length; i++) {
        const [rows] = await pool.query(
            "SELECT ticket_number FROM ticket WHERE giveaway_id = ? AND ticket_number = ?",
        [giveawayId, tickets[i]]
        );
        if (rows.length > 0) {
          //Si está nuestro boleto elegido en la base de datos retornamos error
          return res.status(400).json({
            error:
              "Lo sentimos algunos de los boletos seleccionados ya no están disponibles, intenta con otros",
          });
        }
    }

    const date = new Date().toLocaleDateString();
    //Insertar código para meter boletos a la base de datos pero dejarlos como pendientes, en caso de que la compra no se haga eliminar los registros en el payment
    const [response] = await pool.query(
        "INSERT INTO sales VALUES(0, ?, ?, ?, ?, 0, null)",  //cero para dejar la compra en estatus pendiente y el null es porque aun no hay id de compra
        [userId, date, giveawayId, giveawayBenefic]
    );

    //Extraemos el id de compra insertado
    const { insertId } = response;

    //Insertar en base de datos los boletos comprados, en caso de cancelarse la compra se eliminan los registros en el payment
    for (let i = 0; i < tickets.length; i++) {
        const resp = await pool.query(
            "INSERT INTO ticket VALUES (0, ?, ?, ?, ?, ?, 1)",
            [giveawayId, tickets[i], userId, ticketPrice, insertId] //1 comprado, 2 regalado. Es para apartar los boletos
        );
    }

    //Crear checkout de stripe
    let description = "";
    tickets.forEach((element, i) => {
        if(i === tickets.length - 1)
            description += `${element}`;
        else
            description += `${element}, `;
    });

    const aux_date = new Date().getTime();
    const expireDate = new Date(aux_date + 1800000).getTime() / 1000;
    const session = await stripe.checkout.sessions.create({
      //30 minutos
      expires_at: Math.floor(expireDate),
      metadata: {
        userId: userId,
        saleId: insertId,
        giveawayId: giveawayId,
        giveawayBenefic: giveawayBenefic,
        ticketPrice: ticketPrice,
        tickets: tickets.toString(),
      },
      line_items: [
        {
          price: "price_1NcEZqBten3NBtUposUQ1EHW",
          quantity: tickets.length,
        },
      ],

      payment_intent_data: {
        description: `Compra de boletos ${description}`,
        receipt_email: userEmail,
      },
      payment_method_types: ["card"],
      success_url: "http://localhost:5173/mySales",
      cancel_url: `http://localhost:3000/api/webhook/cancel/${giveawayId}/${insertId}`,
      mode: "payment",
    });

    return res.json({
        url: session.url,
    });

  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: "Algo salió mal",
    });
  }
};

export const getSaleById = async (req = request, res = response) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    "SELECT sales.id, sales.benefic, sales.id_user, sales.sale_date, sales.giveaway_id, giveaway.car, giveaway. description, giveaway.giveaway_date, giveaway.creation_date, giveaway.status FROM sales INNER JOIN giveaway ON giveaway_id = giveaway.id WHERE sales.id = ?",
    [id]
  );

  if (rows.length > 0) {
    const [data] = await pool.query("SELECT * FROM ticket WHERE sale_id = ?", [
      id,
    ]);

    return res.json({
      saleData: rows[0],
      ticketsData: data,
    });
  } else {
    return res.status(400).json({
      error: "Sale not found",
    });
  }
};

export const getSales = async (req = request, res = response) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT sales.id, sales.id_user, sales.sale_date, sales.giveaway_id, giveaway.car, giveaway.description, giveaway.giveaway_date, giveaway.status FROM sales INNER JOIN giveaway ON giveaway_id = giveaway.id WHERE sales.id_user = ? ORDER BY sales.id DESC",
      [userId]
    );

    res.json({
      data: rows,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error,
      msg: "Something was wrong",
    });
  }
};
