import { config } from "dotenv";

config();

export const SERVER_PORT = process.env.SERVER_PORT || 3000;
export const HOST = process.env.HOST;
export const USER = process.env.USER;
export const PASSWORD = process.env.PASSWORD;
export const DB_PORT = process.env.DB_PORT;
export const DATABASE = process.env.DATABASE;

