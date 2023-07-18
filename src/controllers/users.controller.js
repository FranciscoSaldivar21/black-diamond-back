import { pool } from "../database/db.js";
import bcrypt from "bcryptjs";

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
  const { name, phone, email, password } = req.body;
  let date = new Date().toLocaleDateString();

  //Encriptar contraseña
  const salt = bcrypt.genSaltSync();
  const hashPassword = bcrypt.hashSync(password, salt);

  try {
    const [rows] = await pool.query(
      "INSERT INTO user (user_name, user_email, password, register_date, user_status, user_phone) VALUES(?, ?, ?, ?, ?, ?)",
      [name, email, hashPassword, date, "1", phone]
    );
    return res.status(201).send({
      id: rows.insertId,
      phone: phone,
      name: name,
      email: email,
      token: "ugeqdhyuiefggr38732378gbidf",
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

  if ( fromDB.length > 0 && (await bcrypt.compare(password, fromDB[0].password))) {
    return res.status(200).send({
      id: fromDB[0].user_id,
      name: fromDB[0].user_name,
      phone: fromDB[0].user_phone,
      email: fromDB[0].user_email,
      token: "ugeqdhyuiefggr38732378gbidf",
    });
  } else {
      return res.status(401).json({
        error: "Usuario o contraseña incorrectos",
      });
  }

}

export const getUserById = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM user WHERE id_user = ? LIMIT 1",
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

  console.log(id);
  console.log(name, email, phone);

  const [response] = await pool.query(
    //Si no se recibe un dato coloca el que está por defecto
    "UPDATE user SET user_email = ?, user_name = ?, user_phone = ?  WHERE user_id = ?",
    [email, name, phone, id]
  );
  const { affectedRows } = response;
  console.log(affectedRows);
  if (affectedRows <= 0)
    return res.status(404).json({
      message: "Something was wrong",
    });

  res.sendStatus(204); //It was ok  but I dont send anything
};
