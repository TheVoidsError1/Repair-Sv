import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { Repair, RepairStatus, ServiceType } from '../entities/Repair.js';
import { Customer } from '../entities/Customer.js';
import { Part } from '../entities/Part.js';
import { Between, In } from 'typeorm';

const router = Router();

// Get all repairs
router.get('/', async (req, res) => {
  try {
    const repairRepository = AppDataSource.getRepository(Repair);
    const partRepository = AppDataSource.getRepository(Part);
    const repairs = await repairRepository.find({
      relations: ['customer', 'assignedTo', 'selectedPart'],
      order: { createdAt: 'DESC' },
    });

    // ดึงข้อมูล parts ทั้งหมดจาก selectedPartIds สำหรับแต่ละ repair
    const repairsWithParts = await Promise.all(
      repairs.map(async (repair) => {
        if (repair.selectedPartIds) {
          try {
            const partIds = JSON.parse(repair.selectedPartIds);
            if (Array.isArray(partIds) && partIds.length > 0) {
              const selectedParts = await partRepository.find({
                where: { id: In(partIds) },
              });
              return {
                ...repair,
                selectedParts,
              };
            }
          } catch (error) {
            console.error('Error parsing selectedPartIds for repair:', repair.id, error);
          }
        }
        // ถ้าไม่มี selectedPartIds แต่มี selectedPart ให้แปลงเป็น array
        if (repair.selectedPart) {
          return {
            ...repair,
            selectedParts: [repair.selectedPart],
          };
        }
        return repair;
      })
    );

    res.json({
      status: 'success',
      data: repairsWithParts,
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
      relations: ['customer', 'assignedTo', 'selectedPart'],
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

// Create repair with customer
router.post('/', async (req, res) => {
  try {
    const repairRepository = AppDataSource.getRepository(Repair);
    const customerRepository = AppDataSource.getRepository(Customer);

    // Extract customer data from request
    const {
      customer: customerName,
      phone,
      // Repair data
      serialNumber,
      model,
      color,
      screenLockCode,
      problemSymptoms,
      deposit,
      estimatedPrice,
      repairSummaryPrice,
      dateOfReport,
      timeOfReport,
      scheduledPickupTime,
      service_type,
      receive_date,
      receive_time,
      selectedPartId, // Keep for backward compatibility
      selectedPartIds, // New: array of part IDs
      deviceType = 'phone',
      deviceBrand,
      deviceModel,
      deviceSerialNumber,
      deviceColor,
      problemDescription,
      diagnosis,
      repairNotes,
      status = RepairStatus.PENDING,
      laborCost = 0,
      partsCost = 0,
      totalCost = 0,
      warrantyInfo,
    } = req.body;

    // Validate required fields
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer name is required',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required',
      });
    }

    // Find or create customer
    let customer = await customerRepository.findOne({
      where: { phone: phone.trim() },
    });

    if (!customer) {
      // Parse customer name - support both fullName and firstName/lastName
      const nameParts = customerName.trim().split(/\s+/);
      const firstName = nameParts[0] || customerName.trim();
      const lastName = nameParts.slice(1).join(' ') || '';
      
      customer = customerRepository.create({
        firstName: firstName,
        lastName: lastName || undefined,
        fullName: customerName.trim(),
        phone: phone.trim(),
      });
      customer = await customerRepository.save(customer);
    } else {
      // Update customer name if provided and different
      if (customerName.trim() && customerName.trim() !== (customer.fullName || `${customer.firstName} ${customer.lastName || ''}`.trim())) {
        const nameParts = customerName.trim().split(/\s+/);
        customer.firstName = nameParts[0] || customerName.trim();
        customer.lastName = nameParts.slice(1).join(' ') || undefined;
        customer.fullName = customerName.trim();
        customer = await customerRepository.save(customer);
      }
    }

    // Generate repair number if not provided (REP-YYYY-001, REP-YYYY-002, ...)
    let repairNumber = req.body.repairNumber;
    if (!repairNumber) {
      const currentYear = new Date().getFullYear();
      // Count repairs created in the current year
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear + 1, 0, 1);
      const count = await repairRepository.count({
        where: {
          createdAt: Between(startOfYear, endOfYear),
        },
      });
      repairNumber = `REP-${currentYear}-${String(count + 1).padStart(3, '0')}`;
    }

    // Parse dates
    let parsedDateOfReport: Date | undefined;
    if (dateOfReport) {
      // Support multiple date formats
      if (dateOfReport.includes('/')) {
        const [day, month, year] = dateOfReport.split('/').map(Number);
        parsedDateOfReport = new Date(year > 2500 ? year - 543 : year, month - 1, day);
      } else if (dateOfReport.includes('-')) {
        parsedDateOfReport = new Date(dateOfReport);
      } else {
        parsedDateOfReport = new Date(dateOfReport);
      }
      if (isNaN(parsedDateOfReport.getTime())) {
        parsedDateOfReport = undefined;
      }
    }

    let parsedReceiveDate: Date | undefined;
    if (receive_date) {
      parsedReceiveDate = new Date(receive_date);
      if (isNaN(parsedReceiveDate.getTime())) {
        parsedReceiveDate = undefined;
      }
    }

    let parsedScheduledPickupTime: Date | undefined;
    if (scheduledPickupTime) {
      parsedScheduledPickupTime = new Date(scheduledPickupTime);
      if (isNaN(parsedScheduledPickupTime.getTime())) {
        parsedScheduledPickupTime = undefined;
      }
    }

    // Create repair
    const repairData: any = {
      repairNumber,
      customerId: customer.id,
      deviceType,
      deviceBrand: deviceBrand || undefined,
      deviceModel: deviceModel || model || undefined,
      deviceSerialNumber: deviceSerialNumber || undefined,
      serialNumber: serialNumber || undefined,
      deviceColor: deviceColor || color || undefined,
      screenLockCode: screenLockCode || undefined,
      problemDescription: problemDescription || problemSymptoms || '',
      problemSymptoms: problemSymptoms || undefined,
      diagnosis: diagnosis || undefined,
      repairNotes: repairNotes || undefined,
      status,
      laborCost: parseFloat(String(laborCost)) || 0,
      partsCost: parseFloat(String(partsCost)) || 0,
      totalCost: parseFloat(String(totalCost)) || 0,
      deposit: deposit ? parseFloat(String(deposit)) : undefined,
      estimatedPrice: estimatedPrice ? parseFloat(String(estimatedPrice)) : undefined,
      repairSummaryPrice: repairSummaryPrice ? parseFloat(String(repairSummaryPrice)) : undefined,
      serviceType: service_type || ServiceType.WALK_IN,
      receiveDate: parsedReceiveDate,
      receiveTime: receive_time || undefined,
      scheduledPickupTime: parsedScheduledPickupTime,
      dateOfReport: parsedDateOfReport,
      timeOfReport: timeOfReport || undefined,
      selectedPartId: selectedPartIds && selectedPartIds.length > 0 ? selectedPartIds[0] : (selectedPartId || undefined), // Use first part ID for backward compatibility
      selectedPartIds: selectedPartIds && selectedPartIds.length > 0 ? JSON.stringify(selectedPartIds) : undefined, // Store as JSON string
      warrantyInfo: warrantyInfo || undefined,
    };

    const newRepair = repairRepository.create(repairData);
    const savedRepair = await repairRepository.save(newRepair);
    
    // Load relations - handle both single entity and array cases
    const repairId = Array.isArray(savedRepair) 
      ? (savedRepair[0] as Repair).id 
      : (savedRepair as Repair).id;
    const repairWithRelations = await repairRepository.findOne({
      where: { id: repairId },
      relations: ['customer', 'assignedTo', 'selectedPart'],
    });

    // ดึงข้อมูล parts ทั้งหมดจาก selectedPartIds (ถ้ามี)
    let selectedParts = null;
    if (repairWithRelations?.selectedPartIds) {
      try {
        const partIds = JSON.parse(repairWithRelations.selectedPartIds);
        if (Array.isArray(partIds) && partIds.length > 0) {
          const partRepository = AppDataSource.getRepository(Part);
          selectedParts = await partRepository.find({
            where: { id: In(partIds) },
          });
        }
      } catch (error) {
        console.error('Error parsing selectedPartIds:', error);
      }
    }

    // เพิ่ม selectedParts ลงใน response
    const responseData = {
      ...repairWithRelations,
      selectedParts: selectedParts || (repairWithRelations?.selectedPart ? [repairWithRelations.selectedPart] : null),
    };

    res.status(201).json({
      status: 'success',
      data: responseData,
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
    
    console.log(`[Update Repair] Looking for repair with id/repairNumber: ${id}`);
    
    // Check if id is a valid UUID format (8-4-4-4-12 hex characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    
    let repair;
    if (isUUID) {
      // If it's a UUID, search by id
      repair = await repairRepository.findOne({ where: { id } });
    } else {
      // If it's not a UUID, it's likely a repairNumber
      repair = await repairRepository.findOne({ where: { repairNumber: id } });
    }

    if (!repair) {
      console.log(`[Update Repair] Repair not found: ${id}`);
      return res.status(404).json({
        status: 'error',
        message: 'Repair not found',
      });
    }

    console.log(`[Update Repair] Found repair: ${repair.id} (${repair.repairNumber}), current status: ${repair.status}`);
    console.log(`[Update Repair] Request body:`, JSON.stringify(req.body, null, 2));

    // Validate status if provided
    if (req.body.status !== undefined) {
      const validStatuses = Object.values(RepairStatus);
      if (!validStatuses.includes(req.body.status)) {
        console.log(`[Update Repair] Invalid status: ${req.body.status}, valid: ${validStatuses.join(', ')}`);
        return res.status(400).json({
          status: 'error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
      repair.status = req.body.status as RepairStatus;
      console.log(`[Update Repair] Setting status to: ${repair.status}`);
    }

    // Update other fields (excluding status which we already handled)
    const { status, ...otherFields } = req.body;
    if (Object.keys(otherFields).length > 0) {
      Object.assign(repair, otherFields);
    }
    
    console.log(`[Update Repair] Saving repair with status: ${repair.status}`);
    const updatedRepair = await repairRepository.save(repair);
    console.log(`[Update Repair] Saved successfully: ${updatedRepair.id}`);
    
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
    console.error('[Update Repair] Error details:', error);
    if (error instanceof Error) {
      console.error('[Update Repair] Error message:', error.message);
      console.error('[Update Repair] Error stack:', error.stack);
    }
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


