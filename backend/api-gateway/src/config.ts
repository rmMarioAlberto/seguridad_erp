import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'erp-jwt-super-secreto-2024',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  TICKETS_SERVICE_URL: process.env.TICKETS_SERVICE_URL || 'http://localhost:3002',
  GROUPS_SERVICE_URL: process.env.GROUPS_SERVICE_URL || 'http://localhost:3003',
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 60000,
};
