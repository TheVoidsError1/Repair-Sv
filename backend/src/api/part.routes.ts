import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { Part } from '../entities/Part.js';

const router = Router();

// Validation helper functions
const validatePrice = (price: any): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
};

const validateInteger = (value: any): boolean => {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  return !isNaN(numValue) && Number.isInteger(numValue) && numValue >= 0;
};

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
    const { 
      name,
      nameTh,
      partNumber, 
      brand, 
      model, 
      description, 
      costPrice,
      price, 
      stockQuantity, 
      minStockLevel, 
      category,
      categoryTh,
      location, 
      notes 
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Part name is required',
      });
    }

    if (price === undefined || price === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Selling price is required',
      });
    }

    if (!validatePrice(price)) {
      return res.status(400).json({
        status: 'error',
        message: 'Selling price must be a valid number greater than or equal to 0',
      });
    }

    if (costPrice !== undefined && costPrice !== null && !validatePrice(costPrice)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cost price must be a valid number greater than or equal to 0',
      });
    }

    if (stockQuantity !== undefined && stockQuantity !== null && !validateInteger(stockQuantity)) {
      return res.status(400).json({
        status: 'error',
        message: 'Stock quantity must be a valid integer greater than or equal to 0',
      });
    }

    if (minStockLevel !== undefined && minStockLevel !== null && !validateInteger(minStockLevel)) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimum stock level must be a valid integer greater than or equal to 0',
      });
    }

    const partRepository = AppDataSource.getRepository(Part);
    
    // Check if partNumber already exists (if provided)
    if (partNumber && partNumber.trim()) {
      const existingPart = await partRepository.findOne({
        where: { partNumber: partNumber.trim() },
      });
      if (existingPart) {
        return res.status(400).json({
          status: 'error',
          message: 'Part number already exists',
        });
      }
    }

    const newPart = partRepository.create({
      name: name.trim(),
      nameTh: nameTh?.trim() || null,
      partNumber: partNumber?.trim() || null,
      brand: brand?.trim() || null,
      model: model?.trim() || null,
      description: description?.trim() || null,
      costPrice: costPrice !== undefined && costPrice !== null
        ? (typeof costPrice === 'string' ? parseFloat(costPrice) : costPrice)
        : 0,
      price: typeof price === 'string' ? parseFloat(price) : price,
      stockQuantity: stockQuantity !== undefined && stockQuantity !== null 
        ? (typeof stockQuantity === 'string' ? parseInt(stockQuantity, 10) : stockQuantity)
        : 0,
      minStockLevel: minStockLevel !== undefined && minStockLevel !== null
        ? (typeof minStockLevel === 'string' ? parseInt(minStockLevel, 10) : minStockLevel)
        : 10,
      category: category?.trim() || null,
      categoryTh: categoryTh?.trim() || null,
      location: location?.trim() || null,
      notes: notes?.trim() || null,
    });

    const savedPart = await partRepository.save(newPart);

    res.status(201).json({
      status: 'success',
      data: savedPart,
      message: 'Part created successfully',
    });
  } catch (error) {
    console.error('Create part error:', error);
    
    // Handle database constraint errors
    if (error instanceof Error && error.message.includes('duplicate')) {
      return res.status(400).json({
        status: 'error',
        message: 'Part with this information already exists',
      });
    }

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
    const { 
      name,
      nameTh,
      partNumber, 
      brand, 
      model, 
      description,
      costPrice,
      price, 
      stockQuantity, 
      minStockLevel, 
      category,
      categoryTh,
      location, 
      notes 
    } = req.body;
    
    const partRepository = AppDataSource.getRepository(Part);
    const part = await partRepository.findOne({ where: { id } });

    if (!part) {
      return res.status(404).json({
        status: 'error',
        message: 'Part not found',
      });
    }

    // Validation
    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Part name cannot be empty',
      });
    }

    if (price !== undefined && price !== null && !validatePrice(price)) {
      return res.status(400).json({
        status: 'error',
        message: 'Selling price must be a valid number greater than or equal to 0',
      });
    }

    if (costPrice !== undefined && costPrice !== null && !validatePrice(costPrice)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cost price must be a valid number greater than or equal to 0',
      });
    }

    if (stockQuantity !== undefined && stockQuantity !== null && !validateInteger(stockQuantity)) {
      return res.status(400).json({
        status: 'error',
        message: 'Stock quantity must be a valid integer greater than or equal to 0',
      });
    }

    if (minStockLevel !== undefined && minStockLevel !== null && !validateInteger(minStockLevel)) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimum stock level must be a valid integer greater than or equal to 0',
      });
    }

    // Check if partNumber already exists (excluding current part)
    if (partNumber && partNumber.trim() && partNumber !== part.partNumber) {
      const existingPart = await partRepository.findOne({
        where: { partNumber: partNumber.trim() },
      });
      if (existingPart) {
        return res.status(400).json({
          status: 'error',
          message: 'Part number already exists',
        });
      }
    }

    // Update only provided fields
    if (name !== undefined) part.name = name.trim();
    if (nameTh !== undefined) part.nameTh = nameTh?.trim() || null;
    if (partNumber !== undefined) part.partNumber = partNumber?.trim() || null;
    if (brand !== undefined) part.brand = brand?.trim() || null;
    if (model !== undefined) part.model = model?.trim() || null;
    if (description !== undefined) part.description = description?.trim() || null;
    if (costPrice !== undefined && costPrice !== null) {
      part.costPrice = typeof costPrice === 'string' ? parseFloat(costPrice) : costPrice;
    }
    if (price !== undefined && price !== null) {
      part.price = typeof price === 'string' ? parseFloat(price) : price;
    }
    if (stockQuantity !== undefined && stockQuantity !== null) {
      part.stockQuantity = typeof stockQuantity === 'string' 
        ? parseInt(stockQuantity, 10) 
        : stockQuantity;
    }
    if (minStockLevel !== undefined && minStockLevel !== null) {
      part.minStockLevel = typeof minStockLevel === 'string' 
        ? parseInt(minStockLevel, 10) 
        : minStockLevel;
    }
    if (category !== undefined) part.category = category?.trim() || null;
    if (categoryTh !== undefined) part.categoryTh = categoryTh?.trim() || null;
    if (location !== undefined) part.location = location?.trim() || null;
    if (notes !== undefined) part.notes = notes?.trim() || null;

    const updatedPart = await partRepository.save(part);

    res.json({
      status: 'success',
      data: updatedPart,
      message: 'Part updated successfully',
    });
  } catch (error) {
    console.error('Update part error:', error);
    
    // Handle database constraint errors
    if (error instanceof Error && error.message.includes('duplicate')) {
      return res.status(400).json({
        status: 'error',
        message: 'Part with this information already exists',
      });
    }

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
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('foreign key')) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete part that is being used in repairs',
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to delete part',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

