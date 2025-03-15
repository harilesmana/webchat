// src/db/db.ts
import { createConnection } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './schema';

const connection = await createConnection({
  host: "maglev.proxy.rlwy.net",
    port: 48612,
      user: "root",
        password: "lxdIPPTpwbkOlenqPbIqMhIEqRNcTyEN",
          database: "railway",
          });

          export const db = drizzle(connection);