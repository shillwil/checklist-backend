import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { Pool } from "pg";


const migrationClient = new Pool({
    connectionString: process.env.DATABASE_URL as string,
    max: 1
  });

  async function main() {
    await migrate(drizzle(migrationClient), { migrationsFolder: "drizzle/migrations" });
    await migrationClient.end();
  }

  main();