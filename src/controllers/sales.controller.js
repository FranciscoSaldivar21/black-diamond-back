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

    const date = new Date().toLocaleDateString();
    //Insertar código para meter boletos a la base de datos pero dejarlos como pendientes, en caso de que la compra no se haga eliminar los registros en el payment
    const [response] = await pool.query(
      "INSERT INTO Sales VALUES(0, ?, ?, ?, ?, 0, null)", //cero para dejar la compra en estatus pendiente y el null es porque aun no hay id de compra
      [userId, date, giveawayId, giveawayBenefic]
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
    if (tickets.length > 1){
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
      saleId : insertId
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
    res.status(400).json({
      error,
      msg: "Something was wrong",
    });
  }
};
