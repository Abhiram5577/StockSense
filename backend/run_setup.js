import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function runSetup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stocksense',
    multipleStatements: true
  });

  console.log('Connected to database. Running setup...');

  try {
    const productsSql = fs.readFileSync(path.join(__dirname, 'sql/products.sql'), 'utf8');
    console.log('Executing products.sql...');
    await connection.query(productsSql);

    const stockSql = fs.readFileSync(path.join(__dirname, 'sql/stock.sql'), 'utf8');
    console.log('Executing stock.sql...');
    await connection.query(stockSql);

    const seedSql = fs.readFileSync(path.join(__dirname, 'sql/seed.sql'), 'utf8');
    console.log('Executing seed.sql...');
    await connection.query(seedSql);

    console.log('Database setup complete!');
  } catch (err) {
    console.error('Error during setup:', err);
  } finally {
    await connection.end();
  }
}

runSetup();
