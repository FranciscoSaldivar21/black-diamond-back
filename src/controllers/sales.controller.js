import { request, response } from "express";
import { pool } from "../database/db.js";

export const insertSale = async (req = request, res = response) => {
  const { giveawayId, userId } = req.params;
  const { tickets, ticketPrice, giveawayBenefic, userEmail } = req.body;

  try {
    //Evitar que se vendan boletos dos veces
    for (let i = 0; i < tickets.length; i++) {
      const [rows] = await pool.query(
        "SELECT ticket_number FROM Ticket WHERE giveaway_id = ? AND ticket_number = ?",
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

    let creation_date = new Date().toLocaleDateString();
    const aux = creation_date.split("/");
    creation_date = `${aux[1]}/${aux[0]}/${aux[2]}`;
    //Insertar código para meter boletos a la base de datos pero dejarlos como pendientes, en caso de que la compra no se haga eliminar los registros en el payment
    const [response] = await pool.query(
      "INSERT INTO Sales VALUES(0, ?, ?, ?, ?, 0)", //cero para dejar la compra en estatus pendiente y el null es porque aun no hay id de compra
      [userId, creation_date, giveawayId, giveawayBenefic]
    );

    //Extraemos el id de compra insertado
    const { insertId } = response;

    //Insertar en base de datos los boletos comprados, en caso de cancelarse la compra se eliminan los registros en el payment
    for (let i = 0; i < tickets.length; i++) {
      const resp = await pool.query(
        "INSERT INTO Ticket VALUES (0, ?, ?, ?, ?, ?, 1)",
        [giveawayId, tickets[i], userId, ticketPrice, insertId] //1 comprado, 2 regalado. Es para apartar los boletos
      );
    }

    //Extraer tickets de regalo
    let limit = 0;
    let giftTickets = [];
    if (tickets.length > 1) {
      if (tickets.length > 2 && tickets.length < 5) limit = 7;
      if (tickets.length >= 5 && tickets.length < 8) limit = 15;
      if (tickets.length >= 8 && tickets.length < 10) limit = 22;
      if (tickets.length >= 10) limit = 30;
    }

    while (giftTickets.length < limit) {
      const number = Math.floor(Math.random() * (99999 - 33333)) + 33333;
      const [rows] = await pool.query(
        "SELECT ticket_number FROM Ticket WHERE ticket_number = ?",
        [number]
      );

      if (rows.length > 0) continue;

      giftTickets.push(number);
    }

    for (let i = 0; i < giftTickets.length; i++) {
      const giftTicketsInsertion = await pool.query(
        "INSERT INTO Ticket VALUES (0, ?, ?, ?, ?, ?, 2)",
        [giveawayId, giftTickets[i], userId, ticketPrice, insertId] //1 comprado, 2 regalado.
      );
    }

    return res.json({
      ok: true,
      saleId: insertId,
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
    "SELECT Sales.status AS saleStatus, Sales.id, Sales.benefic, Sales.id_user, Sales.sale_date, Sales.giveaway_id, Giveaway.car, Giveaway. description, Giveaway.giveaway_date, Giveaway.creation_date, Giveaway.status FROM Sales INNER JOIN Giveaway ON giveaway_id = Giveaway.id WHERE Sales.id = ?",
    [id]
  );

  if (rows.length > 0) {
    const [data] = await pool.query("SELECT * FROM Ticket WHERE sale_id = ?", [
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
      "SELECT Sales.id, Sales.status AS saleStatus, Sales.id_user, Sales.sale_date, Sales.giveaway_id, Giveaway.car, Giveaway.description, Giveaway.giveaway_date, Giveaway.status FROM Sales INNER JOIN Giveaway ON giveaway_id = Giveaway.id WHERE Sales.id_user = ? ORDER BY Sales.id DESC",
      [userId]
    );

    res.json({
      data: rows,
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({
      error,
      msg: "Something was wrong",
    });
  }
};

export const getAllSales = async (req = request, res = response) => {
  const { page } = req.params;
  console.log(page);
  const offset = 20;
  const from = parseInt(page) * parseInt(offset);

  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS totalTickets, s.id, s.id_user, s.sale_date, s.status, u.user_email, u.user_name, u.user_phone, g.ticket_price FROM Ticket AS t INNER JOIN Sales AS s INNER JOIN User AS u ON u.user_id = s.id_user INNER JOIN Giveaway as g ON g.id = s.giveaway_id WHERE s.id = t.sale_id AND t.status = 1 GROUP BY t.sale_id LIMIT ? OFFSET ?",
      [offset, from]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.send(400).json(error);
  }
};


export const getBuyerByTicket = async (req = request, res = response) => {
  const { ticket, giveaway_id } = req.params;
  
  try {
    const [ rows ] = await pool.query(
      "SELECT s.id, s.sale_date, s.benefic, s.status, u.user_name, u.adress, u.user_email, u.user_phone, u.register_date FROM Ticket AS t INNER JOIN User AS u ON t.user_id = u.user_id INNER JOIN Sales AS s ON t.sale_id = s.id WHERE t.giveaway_id = ? AND t.ticket_number = ?",
      [giveaway_id, ticket]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.status(400);
  }
}