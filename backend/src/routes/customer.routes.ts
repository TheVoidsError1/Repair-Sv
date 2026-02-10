import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { Customer } from '../entities/Customer.js';

const router = Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const customers = await customerRepository.find({
      order: { createdAt: 'DESC' },
    });

    res.json({
      status: 'success',
      data: customers,
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({
      where: { id },
      relations: ['repairs'],
    });

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    res.json({
      status: 'success',
      data: customer,
    });
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const newCustomer = customerRepository.create(req.body);
    const savedCustomer = await customerRepository.save(newCustomer);

    res.status(201).json({
      status: 'success',
      data: savedCustomer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create customer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({ where: { id } });

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    Object.assign(customer, req.body);
    const updatedCustomer = await customerRepository.save(customer);

    res.json({
      status: 'success',
      data: updatedCustomer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update customer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({ where: { id } });

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    await customerRepository.remove(customer);

    res.json({
      status: 'success',
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete customer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;