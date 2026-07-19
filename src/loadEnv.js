import dotenv from 'dotenv';
import path from 'path';

// Load root .env file first to get BACKEND_ENV
dotenv.config();

const ENV = process.env.BACKEND_ENV || 'prod';
dotenv.config({ path: path.join(process.cwd(), `.env.${ENV}`) });

console.log(`[LoadEnv] Loaded environment: ${ENV}`);
