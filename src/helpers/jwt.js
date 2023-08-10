import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../database/config.js";


export const createJWT = (uid) => {
    return new Promise ((resolve, reject) => {

        jwt.sign({ id: uid }, JWT_SECRET, {
        }, (err, token) => {
            if(err){
                console.log(err);
                reject("Token couldn't create");
            }

            resolve( token )

        });
    })
}
