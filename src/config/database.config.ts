import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as dotenv from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";

dotenv.config();

const databaseConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: String(process.env.DB_USERNAME),
  password: String(process.env.DB_PASSWORD),
  database: String(process.env.DB_NAME),
  entities: [__dirname + "/../**/*.entity.{js,ts}"],
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "debug",
  autoLoadEntities: true
};

const migrationConfig: TypeOrmModuleOptions = {
  ...databaseConfig,
  entities: ["./src/modules/" + "{,./}**/*.entity{.ts,.js}"],
  migrations: ["src/migrations/*.ts"]
};

export { databaseConfig };
export const migrationConnectionSource = new DataSource(
  migrationConfig as DataSourceOptions
);
