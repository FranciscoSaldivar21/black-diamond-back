import { pool } from "../db.js";

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
  const { name, email, password } = req.body;
  let date = new Date().toLocaleDateString();

  try {
    const [rows] = await pool.query(
      "INSERT INTO user (user_name, user_email, password, register_date, user_status) VALUES(?, ?, ?, ?, ?)",
      [name, email, password, date, "1"]
    );
    //Colocar código para generar JWT
    res.send({
      id: rows.insertId,
      name: name,
      email: email,
      token: "ugeqdhyuiefggr38732378gbidf",
    });
  } catch (error) {
    return res.status(500).json({
        error
    })
  }
};

export const getUserById = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM user WHERE id_user = ? LIMIT 1",
    [req.params.id]
  );
  console.log(rows);

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
  const { email, password } = req.body;

  const [response] = await pool.query(
    //Si no se recibe un dato coloca el que está por defecto
    "UPDATE user SET email = IFNULL(?, email), password = IFNULL(?, password) WHERE id_user = ?",
    [email, password, id]
  );
  const { affectedRows } = response;
  console.log(affectedRows);
  if (affectedRows <= 0)
    return res.status(404).json({
      message: "Something was wrong",
    });

  res.sendStatus(204); //It was ok  but I dont send anything
};
