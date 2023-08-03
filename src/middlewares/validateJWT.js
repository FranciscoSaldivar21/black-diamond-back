//Tipado para response
import { request, response } from "express";
import jwt from "jsonwebtoken";


export const validateJWT = (req = request, res = response, next) => {
    // x-token headers
    const token = req.header('x-token');

    if( !token ){
        return res.status(401).json({
            ok: false,
            msg: "No hay token en la petición",
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.id = payload.id;
    } catch (error) {
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido',
        });
    }
    next();
}