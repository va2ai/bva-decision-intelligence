import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create libsql client
const client = createClient({
  url: `file:${process.env.DATABASE_URL || './data/bva.db'}`,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export client for direct access if needed
export { client };
