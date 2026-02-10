import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { Repair } from '../entities/Repair.js';

const router = Router();

// Get all repairs
router.get('/', async (req, res) => {
  try {
    const repairRepository = AppDataSource.getRepository(Repair);
    const repairs = await repairRepository.find({
      relations: ['customer', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      status: 'success',
      data: repairs,
    });
  } catch (error) {
    console.error('Get repairs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch repairs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get repair by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const repairRepository = AppDataSource.getRepository(Repair);
    const repair = await repairRepository.findOne({
      where: { id },
      relations: ['customer', 'assignedTo'],
    });

    if (!repair) {
      return res.status(404).json({
        status: 'error',
        message: 'Repair not found',
      });
    }

    res.json({
      status: 'success',
      data: repair,
    });
  } catch (error) {
    console.error('Get repair by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch repair',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create repair
router.post('/', async (req, res) => {
  try {
    const repairRepository = AppDataSource.getRepository(Repair);
    
    // Generate repair number if not provided
    if (!req.body.repairNumber) {
      const count = await repairRepository.count();
      const year = new Date().getFullYear();
      req.body.repairNumber = `REP-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    const newRepair = repairRepository.create(req.body);
    const savedRepair = await repairRepository.save(newRepair);
    
    // Load relations
    const repairWithRelations = await repairRepository.findOne({
      where: { id: savedRepair[0].id },
      relations: ['customer', 'assignedTo'],
    });

    res.status(201).json({
      status: 'success',
      data: repairWithRelations,
      message: 'Repair created successfully',
    });
  } catch (error) {
    console.error('Create repair error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create repair',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update repair
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const repairRepository = AppDataSource.getRepository(Repair);
    const repair = await repairRepository.findOne({ where: { id } });

    if (!repair) {
      return res.status(404).json({
        status: 'error',
        message: 'Repair not found',
      });
    }

    Object.assign(repair, req.body);
    const updatedRepair = await repairRepository.save(repair);
    
    // Load relations
    const repairWithRelations = await repairRepository.findOne({
      where: { id: updatedRepair.id },
      relations: ['customer', 'assignedTo'],
    });

    res.json({
      status: 'success',
      data: repairWithRelations,
      message: 'Repair updated successfully',
    });
  } catch (error) {
    console.error('Update repair error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update repair',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete repair
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const repairRepository = AppDataSource.getRepository(Repair);
    const repair = await repairRepository.findOne({ where: { id } });

    if (!repair) {
      return res.status(404).json({
        status: 'error',
        message: 'Repair not found',
      });
    }

    await repairRepository.remove(repair);

    res.json({
      status: 'success',
      message: 'Repair deleted successfully',
    });
  } catch (error) {
    console.error('Delete repair error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete repair',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

