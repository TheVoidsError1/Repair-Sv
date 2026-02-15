import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
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

    // Generate new token on login (update existing token)
    const newToken = uuidv4();
    user.token = newToken;
    await personnelRepository.save(user);

    // Return user data (without password and token)
    const { password: _, token: __, ...userWithoutPassword } = user;

    res.json({
      status: 'success',
      data: {
        token: newToken, // Return the new token
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

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Token is required',
      });
    }

    const personnelRepository = AppDataSource.getRepository(Personnel);
    const user = await personnelRepository.findOne({
      where: { token },
    });

    if (user) {
      // Clear token
      user.token = null;
      await personnelRepository.save(user);
    }

    res.json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Change password endpoint
router.post('/change-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID and new password are required',
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 4 characters',
      });
    }

    const personnelRepository = AppDataSource.getRepository(Personnel);
    const user = await personnelRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Update password
    user.password = newPassword;
    await personnelRepository.save(user);

    res.json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

