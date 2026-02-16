import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Customer, Personnel, Part, Repair, WarrantyClaim, Transaction } from '../entities/index.js';

dotenv.config();

// Handle password - if empty or undefined, don't include it in config
const dbPassword = process.env.DB_PASSWORD?.trim();
const passwordConfig = dbPassword && dbPassword.length > 0 
  ? { password: dbPassword } 
  : {};

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'Fixphone',
  username: process.env.DB_USER || 'postgres',
  ...passwordConfig,
  synchronize: process.env.NODE_ENV === 'development', // Auto sync schema in dev (use migrations in production)
  logging: process.env.NODE_ENV === 'development',
  entities: [Customer, Personnel, Part, Repair, WarrantyClaim, Transaction],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
});

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ TypeORM DataSource has been initialized successfully');
    console.log(`📊 Connected to database: ${process.env.DB_NAME || 'Fixphone'}`);
    return true;
  } catch (error) {
    console.error('❌ Error during DataSource initialization:', error);
    throw error;
  }
};

// Close database connection
export const closeDatabase = async () => {
  try {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};
