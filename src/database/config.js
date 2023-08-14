import { config } from "dotenv";

config();

export const SERVER_PORT = process.env.PORT;
export const HOST = process.env.MYSQLHOST;
export const USER = process.env.MYSQLUSER;
export const PASSWORD = process.env.MYSQLPASSWORD;
export const DB_PORT = process.env.MYSQLPORT;
export const DATABASE = process.env.MYSQLDATABASE;
export const JWT_SECRET = process.env.JWT_SECRET;
