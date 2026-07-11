export const seederConfig = {
  database: {
    host: process.env["DB_HOST"] || "localhost",
    port: parseInt(process.env["DB_PORT"] || "5432"),
    username: process.env["DB_USERNAME"] || "postgres",
    password: process.env["DB_PASSWORD"] || "password",
    database: process.env["DB_DATABASE"] || "recruitment_db"
  },

  seeder: {
    clearBeforeSeed: process.env["SEEDER_CLEAR_BEFORE"] === "true",

    developmentMode: process.env["NODE_ENV"] === "development",

    maxRetries: 3,

    retryDelay: 1000
  },

  sampleData: {
    vacancyCount: parseInt(process.env["SEEDER_VACANCY_COUNT"] || "10"),

    pipelineCount: parseInt(process.env["SEEDER_PIPELINE_COUNT"] || "4"),

    createTestData: process.env["SEEDER_CREATE_TEST_DATA"] === "true"
  }
};
