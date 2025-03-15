// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: "maglev.proxy.rlwy.net",
    port: 48612,
    user: "root",
    password: "lxdIPPTpwbkOlenqPbIqMhIEqRNcTyEN",
    database: "railway",
  },
});