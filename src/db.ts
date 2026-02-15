import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

export async function getDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    return connection;
}
