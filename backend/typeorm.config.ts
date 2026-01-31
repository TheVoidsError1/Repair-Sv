import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Customer, Personnel, Part, Repair } from './src/entities/index.js';

dotenv.config();

// Handle password - if empty or undefined, don't include it in config
const dbPassword = process.env.DB_PASSWORD?.trim();
const passwordConfig = dbPassword && dbPassword.length > 0 
  ? { password: dbPassword } 
  : {};

// TypeORM CLI configuration
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'Fixphone',
  username: process.env.DB_USER || 'postgres',
  ...passwordConfig,
  synchronize: false, // Never use synchronize in production, use migrations
  logging: true,
  entities: [Customer, Personnel, Part, Repair],
  migrations: ['src/migrations/**/*.ts', 'dist/migrations/**/*.js'],
  subscribers: ['src/subscribers/**/*.ts', 'dist/subscribers/**/*.js'],
});
