import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { Personnel } from '../entities/Personnel.js';

const router = Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
    }

    const personnelRepository = AppDataSource.getRepository(Personnel);
    const user = await personnelRepository.findOne({
      where: { email, isActive: true },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Simple password check (in production, use bcrypt to hash passwords)
    if (user.password !== password) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      status: 'success',
      data: {
        token: 'mock-jwt-token', // In production, use JWT
        user: userWithoutPassword,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

