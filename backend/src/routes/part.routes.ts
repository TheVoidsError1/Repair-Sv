import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { Part } from '../entities/Part.js';

const router = Router();

// Get all parts
router.get('/', async (req, res) => {
  try {
    const partRepository = AppDataSource.getRepository(Part);
    const parts = await partRepository.find({
      order: { createdAt: 'DESC' },
    });

    res.json({
      status: 'success',
      data: parts,
    });
  } catch (error) {
    console.error('Get parts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch parts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get part by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partRepository = AppDataSource.getRepository(Part);
    const part = await partRepository.findOne({ where: { id } });

    if (!part) {
      return res.status(404).json({
        status: 'error',
        message: 'Part not found',
      });
    }

    res.json({
      status: 'success',
      data: part,
    });
  } catch (error) {
    console.error('Get part by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch part',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create part
router.post('/', async (req, res) => {
  try {
    const partRepository = AppDataSource.getRepository(Part);
    const newPart = partRepository.create(req.body);
    const savedPart = await partRepository.save(newPart);

    res.status(201).json({
      status: 'success',
      data: savedPart,
      message: 'Part created successfully',
    });
  } catch (error) {
    console.error('Create part error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create part',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update part
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partRepository = AppDataSource.getRepository(Part);
    const part = await partRepository.findOne({ where: { id } });

    if (!part) {
      return res.status(404).json({
        status: 'error',
        message: 'Part not found',
      });
    }

    Object.assign(part, req.body);
    const updatedPart = await partRepository.save(part);

    res.json({
      status: 'success',
      data: updatedPart,
      message: 'Part updated successfully',
    });
  } catch (error) {
    console.error('Update part error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update part',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete part
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partRepository = AppDataSource.getRepository(Part);
    const part = await partRepository.findOne({ where: { id } });

    if (!part) {
      return res.status(404).json({
        status: 'error',
        message: 'Part not found',
      });
    }

    await partRepository.remove(part);

    res.json({
      status: 'success',
      message: 'Part deleted successfully',
    });
  } catch (error) {
    console.error('Delete part error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete part',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;