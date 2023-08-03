import { pool } from "../database/db.js";
import bcrypt from "bcryptjs";
import { createJWT } from "../helpers/jwt.js";
import nodemailer from "nodemailer";

export const getUsers = async (req, res) => {
  try {
    const [result] = await pool.query("SELECT * FROM user");
    return res.send(result);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected error",
    });
  }
};

export const createUser = async (req, res) => {
  const { name, phone, email, password, adress } = req.body;
  let date = new Date().toLocaleDateString();

  //Encriptar contraseña
  // const salt = bcrypt.genSaltSync();
  // const hashPassword = bcrypt.hashSync(password, salt);

  try {
    const [rows] = await pool.query(
      "INSERT INTO user (user_name, user_email, password, register_date, user_status, user_phone, adress) VALUES(?, ?, ?, ?, ?, ?, ?)",
      [name, email, password, date, "1", phone, adress]
    );
    const token = await createJWT(rows.insertId);
    return res.status(201).send({
      id: rows.insertId,
      phone: phone,
      name: name,
      email: email,
      adress: adress,
      token,
    });
    //Colocar código para generar JWT
  } catch (error) {
    if (error) {
      return res.status(500).json({
        error: "El email ya existe",
      });
    }
  }
};

export const logIn = async (req, res) => {
  const { email, password } = req.body;

  var [fromDB] = await pool.query(
    "SELECT * from user WHERE user_email  = ? Limit 1",
    [email]
  );

  if ( fromDB.length > 0 && password === fromDB[0].password) {
    const token = await createJWT(fromDB[0].user_id);
    return res.status(200).send({
      id: fromDB[0].user_id,
      name: fromDB[0].user_name,
      phone: fromDB[0].user_phone,
      email: fromDB[0].user_email,
      token, 
    });
  } else {
      return res.status(401).json({
        error: "Usuario o contraseña incorrectos",
      });
  }
}

export const getUserById = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM user WHERE user_id = ? LIMIT 1",
    [req.params.id]
  );

  if (rows.length <= 0)
    return res.status(404).json({
      message: "User not found",
    });

  res.send(rows[0]);
};

export const deleteUser = async (req, res) => {
  const [response] = await pool.query("DELETE FROM user WHERE id_user = ?", [
    req.params.id,
  ]);
  const { affectedRows } = response;

  if (affectedRows <= 0)
    return res.status(404).json({
      message: "User not found",
    });

  res.sendStatus(204); //It was ok  but I dont send anything
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const [response] = await pool.query(
    //Si no se recibe un dato coloca el que está por defecto
    "UPDATE user SET user_email = ?, user_name = ?, user_phone = ?  WHERE user_id = ?",
    [email, name, phone, id]
  );
  const { affectedRows } = response;

  if (affectedRows <= 0)
    return res.status(404).json({
      message: "Something was wrong",
    });

  res.sendStatus(204); //It was ok  but I dont send anything
};



export const forgotMyPassword = async (req, res) => {
  const { email } = req.params;

  var [fromDB] = await pool.query(
    "SELECT user_email, password from user WHERE user_email  = ? Limit 1",
    [email]
  );

  if (fromDB.length > 0) {

    //Send email
    const config = {
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "paco200032@gmail.com",
        pass: "fgkzarznfcitlirl",
      },
    };

    const message = {
      from: "paco200032@gmail.com",
      to: "francisco.saldivar4081@alumnos.udg.mx",
      subject: "Prueba",
      html: `<p>Se ha solicitado una recuperación de contraseña para la pagina de Black Diamond Sorteos</p><br/>
      <p style={{margin-top: 20px}}>La contraseña para el correo: ${email} es: ${fromDB[0].password}</p><br/>
      <p style={{margin-top: 20px}}>Si desconoces esta solicitud ponte en contacto al correo paco200032@gmail.com</p><br/>
      <p style={{margin-top: 40px}}>BLACK DIAMOND SORTEOS</p><br/>`,
    };

    const transport = nodemailer.createTransport(config);
    const info = await transport.sendMail(message);
    
    return res.status(200).json({
      msg: "Ya se envío un correo con tu contraseña",
    });

  } else {
    return res.status(401).json({
      error: "El usuario con ese correo no existe",
    });
  }
};