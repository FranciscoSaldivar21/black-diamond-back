import { config } from "dotenv";

config();

export const SERVER_PORT = process.env.PORT;
export const HOST = process.env.HOST;
export const USER = process.env.USER;
export const PASSWORD = process.env.PASSWORD;
export const DB_PORT = process.env.DB_PORT;
export const DATABASE = process.env.DATABASE;
export const JWT_SECRET = process.env.JWT_SECRET;
