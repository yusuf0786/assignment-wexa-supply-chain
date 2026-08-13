import neo4j, { Driver } from 'neo4j-driver';

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !user || !password) {
  throw new Error('Missing CognoDB environment variables. Check your .env.local file.');
}

// Global variable to hold the driver instance across hot-reloads in Next.js development
declare global {
  // eslint-disable-next-line no-var
  var _neo4jDriver: Driver | undefined;
}

export const driver = global._neo4jDriver || neo4j.driver(uri, neo4j.auth.basic(user, password));

if (process.env.NODE_ENV !== 'production') {
  global._neo4jDriver = driver;
}