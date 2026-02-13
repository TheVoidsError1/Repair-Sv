import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/data-source.js';
import { Personnel } from '../entities/Personnel.js';

const router = Router();

// Get all personnel
router.get('/', async (req, res) => {
  try {
    const personnelRepository = AppDataSource.getRepository(Personnel);
    const personnel = await personnelRepository.find({
      select: ['id', 'firstName', 'lastName', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });

    res.json({
      status: 'success',
      data: personnel,
    });
  } catch (error) {
    console.error('Get personnel error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch personnel',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get personnel by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const personnelRepository = AppDataSource.getRepository(Personnel);
    const personnel = await personnelRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!personnel) {
      return res.status(404).json({
        status: 'error',
        message: 'Personnel not found',
      });
    }

    res.json({
      status: 'success',
      data: personnel,
    });
  } catch (error) {
    console.error('Get personnel by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch personnel',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create personnel (Register)
router.post('/', async (req, res) => {
  try {
    const personnelRepository = AppDataSource.getRepository(Personnel);
    
    // Check if username or email already exists
    if (req.body.username) {
      const existingByUsername = await personnelRepository.findOne({
        where: { username: req.body.username },
      });
      if (existingByUsername) {
        return res.status(400).json({
          status: 'error',
          message: 'Username already exists',
        });
      }
    }

    if (req.body.email) {
      const existingByEmail = await personnelRepository.findOne({
        where: { email: req.body.email },
      });
      if (existingByEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already exists',
        });
      }
    }

    // Generate unique token for the new user
    const token = uuidv4();

    // Create new personnel with token
    const newPersonnel = personnelRepository.create({
      ...req.body,
      token: token,
    });
    await personnelRepository.save(newPersonnel);

    // Fetch the saved personnel without password and token using the username from request
    const savedPersonnel = await personnelRepository.findOne({
      where: { username: req.body.username },
      select: ['id', 'firstName', 'lastName', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!savedPersonnel) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve created personnel',
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        ...savedPersonnel,
        token: token, // Return token only on registration
      },
      message: 'Personnel created successfully',
    });
  } catch (error) {
    console.error('Create personnel error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create personnel',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update personnel
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const personnelRepository = AppDataSource.getRepository(Personnel);
    const personnel = await personnelRepository.findOne({ where: { id } });

    if (!personnel) {
      return res.status(404).json({
        status: 'error',
        message: 'Personnel not found',
      });
    }

    Object.assign(personnel, req.body);
    await personnelRepository.save(personnel);

    // Fetch updated personnel without password
    const updatedPersonnel = await personnelRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });

    res.json({
      status: 'success',
      data: updatedPersonnel,
      message: 'Personnel updated successfully',
    });
  } catch (error) {
    console.error('Update personnel error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update personnel',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete personnel
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const personnelRepository = AppDataSource.getRepository(Personnel);
    const personnel = await personnelRepository.findOne({ where: { id } });

    if (!personnel) {
      return res.status(404).json({
        status: 'error',
        message: 'Personnel not found',
      });
    }

    await personnelRepository.remove(personnel);

    res.json({
      status: 'success',
      message: 'Personnel deleted successfully',
    });
  } catch (error) {
    console.error('Delete personnel error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete personnel',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

