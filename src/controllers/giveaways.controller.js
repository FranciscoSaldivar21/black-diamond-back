import path from "path";
import { pool } from "../database/db.js";
import fs from "fs";
import { fileURLToPath } from "url";
import { request, response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createGiveaway = async (req, res) => {
  const { brand, model, year, description, date, tickets, ticketPrice } = req.body;

  const car = `${brand} ${model} ${year}`;
  const creation_date = new Date().toLocaleDateString();

  try {
    const [rows] = await pool.query(
      "INSERT INTO Giveaway (car, description, giveaway_date, creation_date, tickets, ticket_price) VALUES(?, ?, ?, ?, ?, ?)",
      [car, description, date, creation_date, tickets, ticketPrice]
    );
    
    const id = rows.insertId;

    //Insertar imagenes
    for(let i = 0; i < req.files.length; i++){
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
      return res.status(500).json({
        error: "Something happend",
      });
    }
  }
}

export const getTicketsByGiveawayId = async (req, res = response) => {
  const { giveawayId, offset } = req.params;
  const start = parseInt(offset) * 500 + 1;
  const limit = (parseInt(offset) + 1) * 500;

  try {
      const [result] = await pool.query("SELECT * FROM Ticket WHERE giveaway_id = ? AND ticket_number >= ? AND ticket_number <= ? ORDER BY ticket_number ASC LIMIT 500", [giveawayId, start, limit]);
      return res.send(result);
  } catch (error) {
      console.log(error);
      return res.status(400).json({
      error: "No se encontró la petición"
    })
  }
}

export const getGiveaways = async (req, res) => {
  try {
      const [result] = await pool.query("SELECT * FROM Giveaway WHERE status = ?", [req.params.status]);
      return res.send(result);
  } catch (error) {
      console.log(error)
      return res.status(500).json({
          error: "Unexpected error",
      });
  }
};

export const getGiveawayById = async (req, res) => {
    try {
      const [result] = await pool.query("SELECT * FROM Giveaway WHERE id = ?", [req.params.id]);
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
    const [result] = await pool.query("SELECT image_name FROM Giveaway_images WHERE giveaway_id = ? ORDER BY id", [
      req.params.id,
    ]);


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
    const [images] = await pool.query("SELECT image_name FROM Giveaway_images WHERE giveaway_id = ?", [id]);
    for (let i = 0; i < images.length; i++) {
      //Eliminar imagenes del servidor
      fs.unlinkSync(path.join(__dirname, `../public/uploads/${images[i].image_name}`));
    }

    //Eliminar otras imagenes base de datos
    const resp = await pool.query("DELETE FROM Giveaway_images WHERE giveaway_id = ?", [id]);
    
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
      console.log(error)
      return res.status(500).json({
        error: "Something happend",
      });
    }
  }
};


export const getTicketByNumber = async (req = request, res = response) => {
  const { giveawayId, ticketNumber } = req.params;

  try {
    const [rows] = await pool.query("SELECT ticket_number FROM Ticket WHERE ticket_number = ? AND giveaway_id = ?", [ticketNumber, giveawayId]);
    console.log(rows);

    if(rows.length > 0)
      return res.status(200).send({ found : true });

    return res.status(200).send({ found : false });
  } catch (error) {
    console.log(error);
  }
} 