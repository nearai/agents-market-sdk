import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createMiddleware } from '@agents-market/market';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(express.json());
app.use('/api/market', createMiddleware({
  apiKey: process.env.NEAR_MARKET_API_KEY,
  baseUrl: process.env.NEAR_MARKET_BASE_URL,
  corsOrigins: ['http://localhost:5173', 'http://localhost:4000'],
}));

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Showcase server on :${PORT}`));
