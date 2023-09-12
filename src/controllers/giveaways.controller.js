import path from "path";
import { pool } from "../database/db.js";
import fs from "fs";
import { fileURLToPath } from "url";
import { request, response } from "express";
import req from "express/lib/request.js";
import res from "express/lib/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createGiveaway = async (req, res) => {
  const { brand, model, year, description, date, tickets, ticketPrice } =
    req.body;

  const car = `${brand} ${model} ${year}`;
  let creation_date = new Date().toLocaleDateString();
  const aux = creation_date.split("/");
  creation_date = `${aux[1]}/${aux[0]}/${aux[2]}`;

  try {
    const [rows] = await pool.query(
      "INSERT INTO Giveaway (car, description, giveaway_date, creation_date, tickets, ticket_price, status, winner_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
      [car, description, date, creation_date, tickets, ticketPrice, 1, null] //1 disponible, 0 no disponible
    );

    const id = rows.insertId;

    //Insertar imagenes
    for (let i = 0; i < req.files.length; i++) {
      let image_name = req.files[i].filename;
      const [rows] = await pool.query(
        "INSERT INTO Giveaway_images (image_name, giveaway_id) VALUES(?, ?)",
        [image_name, id]
      );
    }

    return res.status(201).send({
      id: id,
    });
  } catch (error) {
    console.log(error);
    if (error) {
      return res.status(500).json({
        error: "Something happend",
      });
    }
  }
};

export const getTicketsByGiveawayId = async (req, res = response) => {
  const { giveawayId, offset } = req.params;
  const start = parseInt(offset) * 500 + 1;
  const limit = (parseInt(offset) + 1) * 500;

  try {
    const [result] = await pool.query(
      "SELECT * FROM Ticket WHERE giveaway_id = ? AND ticket_number >= ? AND ticket_number <= ? ORDER BY ticket_number ASC LIMIT 500",
      [giveawayId, start, limit]
    );
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "No se encontró la petición",
    });
  }
};

export const getGiveaways = async (req, res) => {
  try {
    const [result] = await pool.query(
      "SELECT * FROM Giveaway WHERE status = ?",
      [req.params.status]
    );
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Unexpected error",
    });
  }
};

export const getGiveawayById = async (req, res) => {
  try {
    const [result] = await pool.query("SELECT * FROM Giveaway WHERE id = ?", [
      req.params.id,
    ]);
    let [giveaway] = result;

    return res.send(giveaway);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected error",
    });
  }
};

export const getGiveawayImages = async (req, res) => {
  try {
    const [result] = await pool.query(
      "SELECT image_name FROM Giveaway_images WHERE giveaway_id = ? ORDER BY id",
      [req.params.id]
    );

    return res.send(result);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected error",
    });
  }
};

export const updateGiveaway = async (req, res) => {
  const id = req.params.id;

  const { brand, model, year, description, date, ticketPrice } = req.body;
  const car = `${brand} ${model} ${year}`;

  try {
    const [rows] = await pool.query(
      "UPDATE Giveaway SET car = ?, description = ?, giveaway_date = ?, ticket_price = ? WHERE id = ?",
      [car, description, date, ticketPrice, id]
    );

    //Seleccionar imagenes de la bdd para eliminarlas del servidor
    const [images] = await pool.query(
      "SELECT image_name FROM Giveaway_images WHERE giveaway_id = ?",
      [id]
    );
    for (let i = 0; i < images.length; i++) {
      //Eliminar imagenes del servidor
      fs.unlinkSync(
        path.join(__dirname, `../public/uploads/${images[i].image_name}`)
      );
    }

    //Eliminar otras imagenes base de datos
    const resp = await pool.query(
      "DELETE FROM Giveaway_images WHERE giveaway_id = ?",
      [id]
    );

    //Insertar imagenes
    for (let i = 0; i < req.files.length; i++) {
      let image_name = req.files[i].filename;
      const [rows] = await pool.query(
        "INSERT INTO Giveaway_images (image_name, giveaway_id) VALUES(?, ?)",
        [image_name, id]
      );
    }

    return res.status(201).send({
      id: id,
    });
  } catch (error) {
    if (error) {
      console.log(error);
      return res.status(500).json({
        error: "Something happend",
      });
    }
  }
};

export const getTicketByNumber = async (req = request, res = response) => {
  const { giveawayId, ticketNumber } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT ticket_number FROM Ticket WHERE ticket_number = ? AND giveaway_id = ?",
      [ticketNumber, giveawayId]
    );
    console.log(rows);

    if (rows.length > 0) return res.status(200).send({ found: true });

    return res.status(200).send({ found: false });
  } catch (error) {
    console.log(error);
  }
};

export const getGiveawayProgress = async (req = request, res = response) => {
  console.log("Desde progreso");
};

export const getTicketsStartWith = async (req = request, res = response) => {
  const { giveawayId, startsWith } = req.params;
  const numberSize = 5;
  const difference = parseInt(numberSize - startsWith.length);

  let array = [];
  let i = 0;
  let j = 0;
  let attemps = 0;
  let limitAttemps = 20;
  while (attemps <= limitAttemps && i < 42) {
    j = 0;
    let numberToAdd = "";
    while (j < difference) {
      const number = Math.floor(Math.floor(Math.random() * (9 - -1 + -1)) + -1);
      if (number > -1) numberToAdd = `${numberToAdd}${number.toString()}`;

      j++;
    }
    numberToAdd = `${startsWith}${numberToAdd}`;

    if (parseInt(numberToAdd) > 33333) {
      numberToAdd = numberToAdd.substring(0, 4);
    }

    try {
      const [rows] = await pool.query(
        "SELECT ticket_number FROM Ticket WHERE ticket_number = ? AND giveaway_id = ?",
        [numberToAdd, giveawayId]
      );
      if (rows.length > 0) {
        attemps++;
        continue;
      } else {
        array.push(parseInt(numberToAdd));
      }
    } catch (error) {
      console.log(error);
    }
    i++;
  }
  try {
    return res.status(200).json({ array });
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const initializeTickets = async (req = request, res = response) => {
  const { giveawayId } = req.params;
  let i = 0;
  let aux = [];
  let attemps = 0;
  while (i < 42 && attemps < 20) {
    const number = Math.floor(Math.random() * (33333 - 1) + 1);
    try {
      const [rows] = await pool.query(
        "SELECT ticket_number FROM Ticket WHERE ticket_number = ? AND giveaway_id = ?",
        [number, giveawayId]
      );
      if (rows > 0) {
        attemps++;
        continue;
      } else {
        aux.push(parseInt(number));
        i++;
      }
    } catch (error) {
      console.log(error);
      return res.sendStatus(400);
    }
  }
  return res.status(200).json({ aux });
};

export const isTicketFree = async (req = request, res = response) => {
  const { ticket, giveawayId } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Ticket WHERE giveaway_id = ? AND ticket_number = ?",
      [giveawayId, ticket]
    );
    if (rows.length > 0) return res.json({ isFree: false });
    else return res.json({ isFree: true });
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const getTicketsEndtWith = async (req = request, res = response) => {
  const { giveawayId, endWith } = req.params;
  const numberSize = 5;
  const difference = parseInt(numberSize - endWith.length);

  let array = [];
  let i = 0;
  let j = 0;
  let attemps = 0;
  let limitAttemps = 20;
  while (attemps <= limitAttemps && i < 42) {
    j = 0;
    let numberToAdd = "";
    while (j < difference) {
      const number = Math.floor(Math.floor(Math.random() * (9 - -1 + -1)) + -1);
      if (number > -1) numberToAdd = `${numberToAdd}${number.toString()}`;

      j++;
    }
    numberToAdd = `${numberToAdd}${endWith}`;

    if (parseInt(numberToAdd) > 33333) {
      numberToAdd = numberToAdd.substring(2, numberToAdd.length);
    }

    try {
      const [rows] = await pool.query(
        "SELECT ticket_number FROM Ticket WHERE ticket_number = ? AND giveaway_id = ?",
        [numberToAdd, giveawayId]
      );
      if (rows.length > 0) {
        attemps++;
        continue;
      } else {
        array.push(parseInt(numberToAdd));
      }
    } catch (error) {
      console.log(error);
    }
    i++;
  }
  try {
    return res.status(200).json({ array });
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const getTicketsContain = async (req = request, res = response) => {
  console.log("Aquí");
  return res.status(200).json({ hola: "Hola" });
};

export const getTicketFree = async (req = request, res = response) => {
  const { giveawayId } = req.params;
	let band = false;
	let number = 0;
	while(!band){
		number = Math.floor(Math.random() * (33333 - 1 + 1) + 1);
		try {
			const [rows] = await pool.query("SELECT ticket_number FROM Ticket WHERE ticket_number = ? AND giveaway_id = ?", [number, giveawayId]);
			if(rows.length === 0){
				band = true;
			}
		} catch (error) {
			console.log(error);
			return res.sendStatus(400);
		}
	}
  return res.status(200).json({ number });
};
