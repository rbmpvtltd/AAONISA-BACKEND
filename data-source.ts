import "reflect-metadata";
import { DataSource } from "typeorm";
import { configDotenv } from "dotenv";

configDotenv();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5433'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    migrations: ['src/database/migrations/*.ts'],
    entities: ['src/**/*.entity.ts'],
    logging: true
});