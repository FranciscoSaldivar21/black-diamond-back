import path from "path";
import { pool } from "../database/db.js";
import fs from "fs";
import { fileURLToPath } from "url";
import { response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createGiveaway = async (req, res) => {
  const { brand, model, year, description, date, tickets, ticketPrice } = req.body;

  const car = `${brand} ${model} ${year}`;
  const creation_date = new Date().toLocaleDateString();

  try {
    const [rows] = await pool.query(
      "INSERT INTO giveaway (car, description, giveaway_date, creation_date, tickets, ticket_price) VALUES(?, ?, ?, ?, ?, ?)",
      [car, description, date, creation_date, tickets, ticketPrice]
    );
    
    const id = rows.insertId;

    //Insertar imagenes
    for(let i = 0; i < req.files.length; i++){
      let image_name = req.files[i].filename;
      const [rows] = await pool.query(
        "INSERT INTO giveaway_images (image_name, giveaway_id) VALUES(?, ?)",
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
  const { giveawayId } = req.params;

  try {
      const [result] = await pool.query("SELECT * FROM ticket WHERE giveaway_id = ?", [giveawayId]);
      return res.send(result);
  } catch (error) {
      return res.status(400).json({
      error: "No se encontró la petición"
    })
  }
}






export const getGiveaways = async (req, res) => {
  try {
      const [result] = await pool.query("SELECT * FROM giveaway WHERE status = ?", [req.params.status]);
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
      const [result] = await pool.query("SELECT * FROM giveaway WHERE id = ?", [req.params.id]);
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
    const [result] = await pool.query("SELECT image_name FROM giveaway_images WHERE giveaway_id = ?", [
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
      "UPDATE giveaway SET car = ?, description = ?, giveaway_date = ?, ticket_price = ? WHERE id = ?",
      [car, description, date, ticketPrice, id]
    );

    //Seleccionar imagenes de la bdd para eliminarlas del servidor
    const [images] = await pool.query("SELECT image_name FROM giveaway_images WHERE giveaway_id = ?", [id]);
    for (let i = 0; i < images.length; i++) {
      //Eliminar imagenes del servidor
      fs.unlinkSync(path.join(__dirname, `../public/uploads/${images[i].image_name}`));
    }

    //Eliminar otras imagenes base de datos
    const resp = await pool.query("DELETE FROM giveaway_images WHERE giveaway_id = ?", [id]);
    
    //Insertar imagenes
    for (let i = 0; i < req.files.length; i++) {
      let image_name = req.files[i].filename;
      const [rows] = await pool.query(
        "INSERT INTO giveaway_images (image_name, giveaway_id) VALUES(?, ?)",
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