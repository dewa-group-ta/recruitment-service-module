#!/usr/bin/env ts-node

import { MainSeeder } from "./main.seeder";
import { migrationConnectionSource } from "../config/database.config";

async function runSeeder() {
  const dataSource = migrationConnectionSource;

  try {
    console.log("Connecting to database...");
    await dataSource.initialize();
    console.log("Database connected successfully!");
    console.log("");

    const seeder = new MainSeeder(dataSource);

    const args = process.argv.slice(2);
    const command = args[0];
    const seederName = args[1];

    switch (command) {
      case "run":
        await seeder.run();
        break;

      case "run-specific":
        if (!seederName) {
          console.error("Please specify a seeder name.");
          console.log("Usage: npm run seed:run-specific <seeder-name>");
          console.log("Available seeders:");
          console.log("• system-configuration");
          console.log("• job-category");
          console.log("• pipeline-template");
          console.log("• recruitment-pipeline");
          console.log("• vacancy-form");
          console.log("• vacancy");
          console.log("• applicants-data");
          console.log("• application");
          process.exit(1);
        }
        await seeder.runSpecificSeeder(seederName);
        break;

      case "clear":
        await seeder.clearAll();
        break;

      default:
        console.log("Recruitment System Database Seeder");
        console.log("=====================================");
        console.log("");
        console.log("Usage:");
        console.log("npm run seed:run - Run all seeders");
        console.log("npm run seed:run-specific <name> - Run specific seeder");
        console.log("npm run seed:clear - Clear all seeded data");
        console.log("");
        console.log("Available seeders:");
        console.log(
          "• system-configuration - Seed system configurations (company info, social media, banners)"
        );
        console.log("• job-category - Seed job categories");
        console.log("• pipeline-template - Seed pipeline templates");
        console.log(
          "• recruitment-pipeline - Seed recruitment pipelines and stages"
        );
        console.log("• vacancy-form - Seed vacancy form templates");
        console.log("• vacancy - Seed sample vacancies");
        console.log("• applicants-data - Seed sample applicants");
        console.log("• application - Seed sample applications");
        console.log("");
        console.log("Examples:");
        console.log("npm run seed:run-specific system-configuration");
        console.log("npm run seed:run-specific job-category");
        console.log("npm run seed:run-specific pipeline-template");
        console.log("npm run seed:run-specific recruitment-pipeline");
        console.log("npm run seed:run-specific vacancy");
        console.log("npm run seed:run-specific applicants-data");
        console.log("npm run seed:run-specific application");
        break;
    }
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log("Database connection closed.");
    }
  }
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

void runSeeder();
