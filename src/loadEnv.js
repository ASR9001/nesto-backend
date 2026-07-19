import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Load root .env file first to get BACKEND_ENV
dotenv.config({ path: path.join(projectRoot, '.env') });

const ENV = process.env.BACKEND_ENV || 'prod';
dotenv.config({ path: path.join(projectRoot, `.env.${ENV}`) });

console.log(`[LoadEnv] Loaded environment: ${ENV}`);
