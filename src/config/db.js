const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Create a connection pool using the pooled URL
// For the backend application, we use the DATABASE_URL (the transaction pooler) 
// to handle many concurrent connections effectively.
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
