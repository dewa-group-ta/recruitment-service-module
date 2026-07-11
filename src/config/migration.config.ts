import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * konfigurasi database untuk typeorm cli migration.
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
  synchronize: false, // jangan pernah pakai synchronize di production
  logging: process.env.NODE_ENV === "development",
  migrationsRun: false,
  migrationsTableName: "migrations",
  migrationsTransactionMode: "each" // tiap migration dijalankan dalam transaksi terpisah
};

export default new DataSource(migrationConfig);
