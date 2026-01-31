import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase, AppDataSource } from './config/data-source.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Database connection test endpoint
app.get('/api/db/test', async (req, res) => {
  try {
    if (AppDataSource.isInitialized) {
      res.json({ 
        status: 'success', 
        message: 'TypeORM database connection successful',
        database: 'Fixphone'
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'Database connection not initialized' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Example query endpoint
app.get('/api/db/query', async (req, res) => {
  try {
    const result = await AppDataSource.query('SELECT version()');
    res.json({ 
      status: 'success', 
      data: result[0],
      database: 'Fixphone'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
const startServer = async () => {
  try {
    // Initialize TypeORM database connection
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Database: Fixphone`);
      console.log(`🔧 TypeORM initialized successfully`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closeDatabase();
  process.exit(0);
});
