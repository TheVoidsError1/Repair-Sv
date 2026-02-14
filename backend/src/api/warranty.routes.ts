import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { WarrantyClaim, WarrantyClaimStatus } from '../entities/WarrantyClaim.js';
import { Repair } from '../entities/Repair.js';

const router = Router();

// Helper function to generate claim number (WRN-001, WRN-002, etc.)
async function generateClaimNumber(): Promise<string> {
  const warrantyRepository = AppDataSource.getRepository(WarrantyClaim);
  const claims = await warrantyRepository.find({
    order: { createdAt: 'DESC' },
    take: 1,
  });
  
  const lastClaim = claims[0];

  if (!lastClaim) {
    return 'WRN-001';
  }

  const match = lastClaim.claimNumber.match(/^WRN-(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    return `WRN-${String(num + 1).padStart(3, '0')}`;
  }

  // Fallback if format doesn't match
  const allClaims = await warrantyRepository.find();
  return `WRN-${String(allClaims.length + 1).padStart(3, '0')}`;
}

// Get all warranty claims
router.get('/', async (req, res) => {
  try {
    const warrantyRepository = AppDataSource.getRepository(WarrantyClaim);
    const claims = await warrantyRepository.find({
      relations: ['repair', 'repair.customer'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      status: 'success',
      data: claims,
    });
  } catch (error) {
    console.error('Get warranty claims error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch warranty claims',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get warranty claim by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const warrantyRepository = AppDataSource.getRepository(WarrantyClaim);
    const claim = await warrantyRepository.findOne({
      where: { id },
      relations: ['repair', 'repair.customer'],
    });

    if (!claim) {
      return res.status(404).json({
        status: 'error',
        message: 'Warranty claim not found',
      });
    }

    res.json({
      status: 'success',
      data: claim,
    });
  } catch (error) {
    console.error('Get warranty claim by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch warranty claim',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create new warranty claim
router.post('/', async (req, res) => {
  try {
    const warrantyRepository = AppDataSource.getRepository(WarrantyClaim);
    const repairRepository = AppDataSource.getRepository(Repair);

    const { repairId, serialNumber, claimReason, claimReasonTh } = req.body;

    // Validate required fields
    if (!repairId) {
      return res.status(400).json({
        status: 'error',
        message: 'Repair ID is required',
      });
    }

    if (!claimReason || !claimReason.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Claim reason is required',
      });
    }

    if (!claimReasonTh || !claimReasonTh.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Claim reason (Thai) is required',
      });
    }

    // Verify repair exists
    const repair = await repairRepository.findOne({
      where: { id: repairId },
    });

    if (!repair) {
      return res.status(404).json({
        status: 'error',
        message: 'Repair not found',
      });
    }

    // Generate claim number
    const claimNumber = await generateClaimNumber();

    // Create new warranty claim
    const newClaim = warrantyRepository.create({
      claimNumber,
      repairId,
      serialNumber: serialNumber || repair.serialNumber,
      claimReason: claimReason.trim(),
      claimReasonTh: claimReasonTh.trim(),
      status: WarrantyClaimStatus.PENDING,
      claimDate: new Date(),
    });

    const savedClaim = await warrantyRepository.save(newClaim);

    // Fetch with relations
    const claimWithRelations = await warrantyRepository.findOne({
      where: { id: savedClaim.id },
      relations: ['repair', 'repair.customer'],
    });

    res.status(201).json({
      status: 'success',
      data: claimWithRelations,
    });
  } catch (error) {
    console.error('Create warranty claim error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create warranty claim',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update warranty claim status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required',
      });
    }

    // Validate status value
    if (!Object.values(WarrantyClaimStatus).includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${Object.values(WarrantyClaimStatus).join(', ')}`,
      });
    }

    const warrantyRepository = AppDataSource.getRepository(WarrantyClaim);
    const claim = await warrantyRepository.findOne({
      where: { id },
    });

    if (!claim) {
      return res.status(404).json({
        status: 'error',
        message: 'Warranty claim not found',
      });
    }

    claim.status = status as WarrantyClaimStatus;
    await warrantyRepository.save(claim);

    // Fetch with relations
    const updatedClaim = await warrantyRepository.findOne({
      where: { id },
      relations: ['repair', 'repair.customer'],
    });

    res.json({
      status: 'success',
      data: updatedClaim,
    });
  } catch (error) {
    console.error('Update warranty claim status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update warranty claim status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update warranty claim
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { serialNumber, claimReason, claimReasonTh, status } = req.body;

    const warrantyRepository = AppDataSource.getRepository(WarrantyClaim);
    const claim = await warrantyRepository.findOne({
      where: { id },
    });

    if (!claim) {
      return res.status(404).json({
        status: 'error',
        message: 'Warranty claim not found',
      });
    }

    // Update fields if provided
    if (serialNumber !== undefined) {
      claim.serialNumber = serialNumber;
    }
    if (claimReason !== undefined) {
      claim.claimReason = claimReason.trim();
    }
    if (claimReasonTh !== undefined) {
      claim.claimReasonTh = claimReasonTh.trim();
    }
    if (status !== undefined) {
      if (!Object.values(WarrantyClaimStatus).includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid status. Must be one of: ${Object.values(WarrantyClaimStatus).join(', ')}`,
        });
      }
      claim.status = status as WarrantyClaimStatus;
    }

    await warrantyRepository.save(claim);

    // Fetch with relations
    const updatedClaim = await warrantyRepository.findOne({
      where: { id },
      relations: ['repair', 'repair.customer'],
    });

    res.json({
      status: 'success',
      data: updatedClaim,
    });
  } catch (error) {
    console.error('Update warranty claim error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update warranty claim',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete warranty claim
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const warrantyRepository = AppDataSource.getRepository(WarrantyClaim);
    const claim = await warrantyRepository.findOne({
      where: { id },
    });

    if (!claim) {
      return res.status(404).json({
        status: 'error',
        message: 'Warranty claim not found',
      });
    }

    await warrantyRepository.remove(claim);

    res.json({
      status: 'success',
      message: 'Warranty claim deleted successfully',
    });
  } catch (error) {
    console.error('Delete warranty claim error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete warranty claim',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
