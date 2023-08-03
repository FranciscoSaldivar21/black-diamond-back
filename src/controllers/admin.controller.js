import { pool } from "../database/db.js";
import { createJWT } from "../helpers/jwt.js";

export const logIn = async (req, res) => {
  const { email, password } = req.body;

  var [fromDB] = await pool.query(
    "SELECT * from admin WHERE email  = ?  AND password = ? Limit 1",
    [email, password]
  );

  if (fromDB.length > 0) {
    const token = await createJWT(fromDB[0].id);

    return res.status(200).send({
      id: fromDB[0].id,
      email: fromDB[0].email,
      token: token,
    });
  } else {
    return res.status(401).json({
      error: "Correo o contraseña incorrectos",
    });
  }
};


export const refreshToken = async (req, res) => {
  const token = await createJWT(req.id);

  res.json({
    ok: true,
    token
  })
}
