import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Database configuration for TypeORM migrations
 * This configuration is used by the TypeORM CLI for running migrations
 */
const migrationConfig: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "recruitment_db",
  entities: [__dirname + "/../**/*.entity.{js,ts}"],
  migrations: [__dirname + "/../migrations/*.{js,ts}"],
  synchronize: false, // Never use synchronize in production
  logging: process.env.NODE_ENV === "development",
  migrationsRun: false,
  migrationsTableName: "migrations",
  migrationsTransactionMode: "each" // Run each migration in a separate transaction
};

export default new DataSource(migrationConfig);
