"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const migrator_1 = require("drizzle-orm/postgres-js/migrator");
const pg_1 = require("pg");
const migrationClient = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1
});
async function main() {
    await (0, migrator_1.migrate)((0, node_postgres_1.drizzle)(migrationClient), { migrationsFolder: "drizzle/migrations" });
    await migrationClient.end();
}
main();
