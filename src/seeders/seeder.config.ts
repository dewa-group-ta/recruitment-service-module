export const seederConfig = {
  // Database connection settings
  database: {
    host: process.env['DB_HOST'] || "localhost",
    port: parseInt(process.env['DB_PORT'] || "5432"),
    username: process.env['DB_USERNAME'] || "postgres",
    password: process.env['DB_PASSWORD'] || "password",
    database: process.env['DB_DATABASE'] || "recruitment_db"
  },

  // Seeder settings
  seeder: {
    // Whether to clear existing data before seeding
    clearBeforeSeed: process.env['SEEDER_CLEAR_BEFORE'] === "true",

    // Whether to run in development mode (more verbose logging)
    developmentMode: process.env['NODE_ENV'] === "development",

    // Maximum number of retries for failed operations
    maxRetries: 3,

    // Delay between retries (in milliseconds)
    retryDelay: 1000
  },

  // Sample data settings
  sampleData: {
    // Number of vacancies to create
    vacancyCount: parseInt(process.env['SEEDER_VACANCY_COUNT'] || "10"),

    // Number of pipelines to create
    pipelineCount: parseInt(process.env['SEEDER_PIPELINE_COUNT'] || "4"),

    // Whether to create additional test data
    createTestData: process.env['SEEDER_CREATE_TEST_DATA'] === "true"
  }
};
