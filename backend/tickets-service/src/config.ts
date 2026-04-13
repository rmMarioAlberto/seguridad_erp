import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3002,
  DATABASE_URL: process.env.DATABASE_URL,
  INTERNAL_SECRET: process.env.INTERNAL_SECRET || 'erp-internal-super-secret-key-2024',
};
