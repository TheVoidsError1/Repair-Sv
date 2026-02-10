import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase, AppDataSource } from './config/data-source.js';
import authRoutes from './api/auth.routes.js';
import personnelRoutes from './api/personnel.routes.js';
import customerRoutes from './api/customer.routes.js';
import repairRoutes from './api/repair.routes.js';
import partRoutes from './api/part.routes.js';
import { Personnel } from './entities/Personnel.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/parts', partRoutes);

// Seed default admin user
const seedDefaultAdmin = async () => {
  const personnelRepository = AppDataSource.getRepository(Personnel);

  const defaultEmail = 'admin@example.com';
  const defaultUsername = 'admin';
  const defaultPassword = '123456';

  // เช็คว่ามี user นี้อยู่แล้วหรือยัง (เช็คจาก email)
  const existing = await personnelRepository.findOne({
    where: { email: defaultEmail },
  });

  if (existing) {
    console.log('👤 Default admin user already exists');
    return;
  }

  const admin = personnelRepository.create({
    firstName: 'Admin',
    lastName: 'User',
    username: defaultUsername,
    password: defaultPassword, // โปรดเปลี่ยนเป็น hash ใน production
    email: defaultEmail,
    phone: '0800000000',
    role: 'admin',
    isActive: true,
  });

  await personnelRepository.save(admin);
  console.log('✅ Created default admin user:');
  console.log(`   Email: ${defaultEmail}`);
  console.log(`   Password: ${defaultPassword}`);
};

// Start server
const startServer = async () => {
  try {
    // Initialize TypeORM database connection
    await initializeDatabase();

    // Seed default admin user
    await seedDefaultAdmin();
    
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
