import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { Repair, RepairStatus } from '../entities/Repair.js';
import { Part } from '../entities/Part.js';
import { Between, In } from 'typeorm';

const router = Router();

// Helper function to calculate date range based on time range
function getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date(); // ใช้เวลาปัจจุบัน
  const startDate = new Date();

  switch (timeRange) {
    case '1d':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case '1w':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '1m':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 6);
  }

  // ตั้ง startDate ให้เป็นเวลาเริ่มต้นวัน
  startDate.setHours(0, 0, 0, 0);
  // ไม่ต้องเปลี่ยน endDate ให้ใช้เวลาปัจจุบัน (เพื่อให้ครอบคลุมถึงปัจจุบัน)
  // แต่ถ้าต้องการให้ครอบคลุมทั้งวัน ใช้ setHours(23, 59, 59, 999)

  return { startDate, endDate };
}

// Get financial summary
router.get('/summary', async (req, res) => {
  try {
    const { timeRange = '6m' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange as string);

    const repairRepository = AppDataSource.getRepository(Repair);
    const partRepository = AppDataSource.getRepository(Part);

    // Get completed repairs within date range
    // Use completedDate if available, otherwise use updatedAt when status changed to COMPLETED
    const completedRepairs = await repairRepository
      .createQueryBuilder('repair')
      .where('repair.status = :status', { status: RepairStatus.COMPLETED })
      .andWhere(
        '(repair.completedDate BETWEEN :startDate AND :endDate OR (repair.completedDate IS NULL AND repair.updatedAt BETWEEN :startDate AND :endDate))',
        { startDate, endDate }
      )
      .leftJoinAndSelect('repair.customer', 'customer')
      .getMany();

    // Calculate total income from completed repairs
    // Use repairSummaryPrice if available, otherwise use totalCost
    const totalIncome = completedRepairs.reduce((sum, repair) => {
      const income = repair.repairSummaryPrice || repair.totalCost || 0;
      return sum + Number(income);
    }, 0);

    // Get all parts used in repairs (from selectedPartIds)
    const allPartIds: string[] = [];
    completedRepairs.forEach((repair) => {
      if (repair.selectedPartIds) {
        try {
          const partIds = JSON.parse(repair.selectedPartIds);
          if (Array.isArray(partIds)) {
            allPartIds.push(...partIds);
          }
        } catch (error) {
          console.error('Error parsing selectedPartIds:', error);
        }
      } else if (repair.selectedPartId) {
        allPartIds.push(repair.selectedPartId);
      }
    });

    // คำนวณต้นทุนจริงของอะไหล่และกำไรจากอะไหล่
    // 1. totalPartsCost = ต้นทุนจริงที่จ่ายไป (costPrice) - ใช้สำหรับค่าใช้จ่ายรวม
    // 2. totalPartsSalePrice = ราคาที่ขายจริงในบิล/ใบแจ้งซ่อม (repairSummaryPrice หรือ totalCost)
    // 3. partsMarkup = กำไรจากอะไหล่ = totalPartsSalePrice - totalPartsCost
    
    let totalPartsCost = 0; // ต้นทุนจริงของอะไหล่ (costPrice) - ใช้สำหรับค่าใช้จ่าย
    let totalPartsSalePrice = 0; // ราคาขายรวมจากบิล/ใบแจ้งซ่อม
    
    // ดึงข้อมูล Part ทั้งหมดที่ใช้ในงานซ่อม
    if (allPartIds.length > 0) {
      const uniquePartIds = [...new Set(allPartIds)];
      const parts = await partRepository.find({
        where: { id: In(uniquePartIds) },
      });

      // สร้าง Map สำหรับเข้าถึงข้อมูล Part ได้เร็วขึ้น
      const partMap = new Map(parts.map(p => [p.id, p]));

      // Count occurrences of each part ID (นับจำนวนอะไหล่ที่ใช้ในแต่ละงาน)
      const partCounts: Record<string, number> = {};
      allPartIds.forEach((id) => {
        partCounts[id] = (partCounts[id] || 0) + 1;
      });

      // คำนวณต้นทุนจริง (costPrice) - ใช้เสมอ
      parts.forEach((part) => {
        const count = partCounts[part.id] || 0;
        const costPrice = Number(part.costPrice) || 0; // ต้นทุนจริง
        totalPartsCost += costPrice * count;
      });
    }

    // คำนวณต้นทุนสำหรับงานที่ไม่มีอะไหล่ที่ระบุในระบบ แต่มี partsCost
    // (กรณีซื้ออะไหล่จากภายนอก - ถือว่าไม่มีกำไรเพราะต้นทุน = ราคาขาย)
    for (const repair of completedRepairs) {
      const hasPartsInSystem = (repair.selectedPartIds && repair.selectedPartIds.trim() !== '') || 
                                repair.selectedPartId;
      const partsCostInRepair = Number(repair.partsCost || 0);
      
      if (!hasPartsInSystem && partsCostInRepair > 0) {
        // ถ้างานนี้ไม่มีอะไหล่ที่ระบุในระบบ แต่มี partsCost
        // นับเป็นต้นทุน (ถือว่าซื้อมาในราคาเท่ากับขาย - ไม่มีกำไร)
        totalPartsCost += partsCostInRepair;
      }
    }

    // คำนวณราคาขายอะไหล่ (partsCost จาก Repair)
    // ใช้ partsCost ที่ขายจริง ไม่ใช่ repairSummaryPrice (เพราะ repairSummaryPrice อาจรวมค่าแรงด้วย)
    for (const repair of completedRepairs) {
      const hasPartsInSystem = (repair.selectedPartIds && repair.selectedPartIds.trim() !== '') || 
                                repair.selectedPartId;
      const partsCostInRepair = Number(repair.partsCost || 0);
      
      if (hasPartsInSystem) {
        // ถ้ามีอะไหล่ในระบบ
        if (partsCostInRepair > 0) {
          // ถ้ามี partsCost บันทึกไว้ ให้ใช้เป็นราคาขายจริง
          totalPartsSalePrice += partsCostInRepair;
        } else {
          // ถ้าไม่มี partsCost ให้คำนวณจาก part.price
          try {
            const partIds = repair.selectedPartIds 
              ? JSON.parse(repair.selectedPartIds)
              : (repair.selectedPartId ? [repair.selectedPartId] : []);
            
            if (Array.isArray(partIds) && partIds.length > 0) {
              const uniquePartIds = [...new Set(partIds)];
              const parts = await partRepository.find({
                where: { id: In(uniquePartIds) },
              });
              
              // นับจำนวนแต่ละ part
              const partCounts: Record<string, number> = {};
              partIds.forEach((id: string) => {
                partCounts[id] = (partCounts[id] || 0) + 1;
              });
              
              // คำนวณราคาขายจาก part.price
              parts.forEach((part) => {
                const count = partCounts[part.id] || 0;
                const salePrice = Number(part.price) || 0;
                totalPartsSalePrice += salePrice * count;
              });
            }
          } catch (error) {
            console.error('Error calculating sale price from parts:', error);
          }
        }
      } else if (partsCostInRepair > 0) {
        // ถ้างานนี้ไม่มีอะไหล่ที่ระบุในระบบ แต่มี partsCost
        // นับเป็นราคาขาย (แต่ไม่มีกำไรเพราะต้นทุน = ราคาขาย)
        totalPartsSalePrice += partsCostInRepair;
      }
    }

    // Calculate total labor cost (ค่าแรง)
    const totalLaborCost = completedRepairs.reduce((sum, repair) => {
      return sum + Number(repair.laborCost || 0);
    }, 0);

    // ค่าใช้จ่ายรวม = ต้นทุนอะไหล่จริง + ค่าแรง
    const totalExpenses = totalPartsCost + totalLaborCost;

    // Net profit
    const netProfit = totalIncome - totalExpenses;

    // Calculate previous period for comparison
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    const previousEndDate = new Date(startDate);

    // Get previous period repairs
    const previousRepairs = await repairRepository
      .createQueryBuilder('repair')
      .where('repair.status = :status', { status: RepairStatus.COMPLETED })
      .andWhere(
        '(repair.completedDate BETWEEN :startDate AND :endDate OR (repair.completedDate IS NULL AND repair.updatedAt BETWEEN :startDate AND :endDate))',
        { startDate: previousStartDate, endDate: previousEndDate }
      )
      .getMany();

    const previousIncome = previousRepairs.reduce((sum, repair) => {
      const income = repair.repairSummaryPrice || repair.totalCost || 0;
      return sum + Number(income);
    }, 0);

    // Calculate previous period actual parts cost
    const previousPartIds: string[] = [];
    previousRepairs.forEach((repair) => {
      if (repair.selectedPartIds) {
        try {
          const partIds = JSON.parse(repair.selectedPartIds);
          if (Array.isArray(partIds)) {
            previousPartIds.push(...partIds);
          }
        } catch (error) {
          console.error('Error parsing selectedPartIds:', error);
        }
      } else if (repair.selectedPartId) {
        previousPartIds.push(repair.selectedPartId);
      }
    });

    let previousPartsCost = 0;
    if (previousPartIds.length > 0) {
      const uniquePartIds = [...new Set(previousPartIds)];
      const previousParts = await partRepository.find({
        where: { id: In(uniquePartIds) },
      });

      const partCounts: Record<string, number> = {};
      previousPartIds.forEach((id) => {
        partCounts[id] = (partCounts[id] || 0) + 1;
      });

      previousParts.forEach((part) => {
        const count = partCounts[part.id] || 0;
        previousPartsCost += Number(part.costPrice) * count;
      });
    }

    // คำนวณจาก partsCost สำหรับงานก่อนหน้าที่ไม่มีอะไหล่ที่ระบุในระบบ
    previousRepairs.forEach((repair) => {
      const hasPartsInSystem = (repair.selectedPartIds && repair.selectedPartIds.trim() !== '') || 
                                repair.selectedPartId;
      
      if (!hasPartsInSystem) {
        const partsCost = Number(repair.partsCost || 0);
        previousPartsCost += partsCost;
      }
    });

    const previousLaborCost = previousRepairs.reduce((sum, repair) => {
      return sum + Number(repair.laborCost || 0);
    }, 0);

    // ค่าใช้จ่ายก่อนหน้า = ต้นทุนอะไหล่ + ค่าแรง
    const previousExpenses = previousPartsCost + previousLaborCost;
    const previousProfit = previousIncome - previousExpenses;

    // Calculate percentage changes
    const incomeChange = previousIncome > 0 
      ? ((totalIncome - previousIncome) / previousIncome) * 100 
      : 0;
    const expensesChange = previousExpenses > 0 
      ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 
      : 0;
    const profitChange = previousProfit !== 0 
      ? ((netProfit - previousProfit) / Math.abs(previousProfit)) * 100 
      : 0;

    // Calculate profit margin (อัตรากำไร)
    const profitMargin = totalIncome > 0 
      ? (netProfit / totalIncome) * 100 
      : 0;

    // Calculate stock value (มูลค่าสต็อกทั้งหมด)
    const allParts = await partRepository.find();
    const totalStockValue = allParts.reduce((sum, part) => {
      return sum + (Number(part.costPrice) * Number(part.stockQuantity));
    }, 0);

    // Calculate total stock quantity
    const totalStockQuantity = allParts.reduce((sum, part) => {
      return sum + Number(part.stockQuantity);
    }, 0);

    // Calculate average profit per repair
    const averageProfitPerRepair = completedRepairs.length > 0
      ? netProfit / completedRepairs.length
      : 0;

    // Calculate parts markup (กำไรจากอะไหล่ = ราคาขาย - ต้นทุนจริง)
    // คำนวณได้จากข้อมูลที่เรามีอยู่แล้ว
    const partsMarkup = totalPartsSalePrice - totalPartsCost;
    const partsMarkupPercentage = totalPartsCost > 0
      ? (partsMarkup / totalPartsCost) * 100
      : 0;

    res.json({
      status: 'success',
      data: {
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        totalPartsCost: Number(totalPartsCost.toFixed(2)), // ต้นทุนจริง
        totalPartsSalePrice: Number(totalPartsSalePrice.toFixed(2)), // ราคาขายอะไหล่
        partsMarkup: Number(partsMarkup.toFixed(2)), // กำไรจากอะไหล่
        partsMarkupPercentage: Number(partsMarkupPercentage.toFixed(2)), // % กำไรจากอะไหล่
        totalLaborCost: Number(totalLaborCost.toFixed(2)),
        incomeChange: Number(incomeChange.toFixed(1)),
        expensesChange: Number(expensesChange.toFixed(1)),
        profitChange: Number(profitChange.toFixed(1)),
        profitMargin: Number(profitMargin.toFixed(2)), // อัตรากำไร %
        totalStockValue: Number(totalStockValue.toFixed(2)), // มูลค่าสต็อก
        totalStockQuantity: totalStockQuantity, // จำนวนสต็อกทั้งหมด
        averageProfitPerRepair: Number(averageProfitPerRepair.toFixed(2)), // กำไรเฉลี่ยต่องาน
        totalRepairs: completedRepairs.length, // จำนวนงานที่เสร็จ
      },
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch financial summary',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get monthly income vs expenses chart data
router.get('/chart/income-expenses', async (req, res) => {
  try {
    const { timeRange = '6m' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange as string);

    const repairRepository = AppDataSource.getRepository(Repair);
    const partRepository = AppDataSource.getRepository(Part);

    // Generate month array
    const months: { month: string; monthTh: string; start: Date; end: Date }[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthNamesTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      
      months.push({
        month: monthNames[current.getMonth()],
        monthTh: monthNamesTh[current.getMonth()],
        start: monthStart,
        end: monthEnd,
      });
      
      current.setMonth(current.getMonth() + 1);
    }

    // Calculate income and expenses for each month
    const chartData = await Promise.all(
      months.map(async (month) => {
        // Get completed repairs for this month
        const repairs = await repairRepository
          .createQueryBuilder('repair')
          .where('repair.status = :status', { status: RepairStatus.COMPLETED })
          .andWhere(
            '(repair.completedDate BETWEEN :startDate AND :endDate OR (repair.completedDate IS NULL AND repair.updatedAt BETWEEN :startDate AND :endDate))',
            { startDate: month.start, endDate: month.end }
          )
          .getMany();

        // Calculate income
        const income = repairs.reduce((sum, repair) => {
          const repairIncome = repair.repairSummaryPrice || repair.totalCost || 0;
          return sum + Number(repairIncome);
        }, 0);

        // คำนวณค่าใช้จ่ายรายเดือน (ต้นทุนจริงของอะไหล่ + ค่าแรง)
        // Get parts used in this month's repairs
        const monthPartIds: string[] = [];
        repairs.forEach((repair) => {
          if (repair.selectedPartIds) {
            try {
              const partIds = JSON.parse(repair.selectedPartIds);
              if (Array.isArray(partIds)) {
                monthPartIds.push(...partIds);
              }
            } catch (error) {
              console.error('Error parsing selectedPartIds:', error);
            }
          } else if (repair.selectedPartId) {
            monthPartIds.push(repair.selectedPartId);
          }
        });

        // คำนวณต้นทุนจริงของอะไหล่ที่ใช้ในเดือนนี้ (costPrice = ราคาทุนที่ซื้อมา)
        let monthPartsCost = 0;
        if (monthPartIds.length > 0) {
          const uniquePartIds = [...new Set(monthPartIds)];
          const monthParts = await partRepository.find({
            where: { id: In(uniquePartIds) },
          });

          const partCounts: Record<string, number> = {};
          monthPartIds.forEach((id) => {
            partCounts[id] = (partCounts[id] || 0) + 1;
          });

          monthParts.forEach((part) => {
            const count = partCounts[part.id] || 0;
            const partCost = Number(part.costPrice) || 0; // ใช้ costPrice (ต้นทุนจริง)
            monthPartsCost += partCost * count;
          });
        }

        // คำนวณจาก partsCost สำหรับงานที่ไม่มีอะไหล่ที่ระบุในระบบ
        repairs.forEach((repair) => {
          const hasPartsInSystem = (repair.selectedPartIds && repair.selectedPartIds.trim() !== '') || 
                                    repair.selectedPartId;
          
          if (!hasPartsInSystem) {
            const partsCost = Number(repair.partsCost || 0);
            monthPartsCost += partsCost;
          }
        });

        // ค่าแรงในเดือนนี้
        const monthLaborCost = repairs.reduce((sum, repair) => {
          return sum + Number(repair.laborCost || 0);
        }, 0);

        // ค่าใช้จ่ายรวมของเดือน = ต้นทุนอะไหล่จริง + ค่าแรง
        const expenses = monthPartsCost + monthLaborCost;

        return {
          month: month.month,
          monthTh: month.monthTh,
          income: Number(income.toFixed(2)),
          expenses: Number(expenses.toFixed(2)),
        };
      })
    );

    res.json({
      status: 'success',
      data: chartData,
    });
  } catch (error) {
    console.error('Get income-expenses chart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chart data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get expense breakdown (pie chart data)
router.get('/chart/expense-breakdown', async (req, res) => {
  try {
    const { timeRange = '6m' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange as string);

    const repairRepository = AppDataSource.getRepository(Repair);
    const partRepository = AppDataSource.getRepository(Part);

    // Get completed repairs within date range
    const completedRepairs = await repairRepository
      .createQueryBuilder('repair')
      .where('repair.status = :status', { status: RepairStatus.COMPLETED })
      .andWhere(
        '(repair.completedDate BETWEEN :startDate AND :endDate OR (repair.completedDate IS NULL AND repair.updatedAt BETWEEN :startDate AND :endDate))',
        { startDate, endDate }
      )
      .getMany();

    // คำนวณต้นทุนจริงของอะไหล่ที่ใช้ในงานซ่อม (costPrice = ราคาทุนที่ซื้อมา)
    // สำหรับ expense breakdown ใช้ต้นทุนจริงในการคำนวณ
    const allPartIds: string[] = [];
    completedRepairs.forEach((repair) => {
      if (repair.selectedPartIds) {
        try {
          const partIds = JSON.parse(repair.selectedPartIds);
          if (Array.isArray(partIds)) {
            allPartIds.push(...partIds);
          }
        } catch (error) {
          console.error('Error parsing selectedPartIds:', error);
        }
      } else if (repair.selectedPartId) {
        allPartIds.push(repair.selectedPartId);
      }
    });

    let totalPartsCost = 0;
    if (allPartIds.length > 0) {
      const uniquePartIds = [...new Set(allPartIds)];
      const parts = await partRepository.find({
        where: { id: In(uniquePartIds) },
      });

      const partCounts: Record<string, number> = {};
      allPartIds.forEach((id) => {
        partCounts[id] = (partCounts[id] || 0) + 1;
      });

      parts.forEach((part) => {
        const count = partCounts[part.id] || 0;
        const partCost = Number(part.costPrice) || 0; // ใช้ costPrice (ต้นทุนจริง)
        totalPartsCost += partCost * count;
      });
    }

    // คำนวณจาก partsCost สำหรับงานที่ไม่มีอะไหล่ที่ระบุในระบบ
    completedRepairs.forEach((repair) => {
      const hasPartsInSystem = (repair.selectedPartIds && repair.selectedPartIds.trim() !== '') || 
                                repair.selectedPartId;
      
      if (!hasPartsInSystem) {
        const partsCost = Number(repair.partsCost || 0);
        totalPartsCost += partsCost;
      }
    });

    // Calculate total labor cost (ค่าแรง)
    const totalLaborCost = completedRepairs.reduce((sum, repair) => {
      return sum + Number(repair.laborCost || 0);
    }, 0);

    // ค่าใช้จ่ายรวม = ต้นทุนอะไหล่จริง + ค่าแรง
    const totalExpenses = totalPartsCost + totalLaborCost;

    // Calculate percentages
    const partsPercentage = totalExpenses > 0 
      ? (totalPartsCost / totalExpenses) * 100 
      : 0;
    const laborPercentage = totalExpenses > 0 
      ? (totalLaborCost / totalExpenses) * 100 
      : 0;

    // Expense breakdown - แสดงเฉพาะรายการที่มีค่ามากกว่า 0
    const breakdown = [];
    
    if (totalPartsCost > 0) {
      breakdown.push({
        name: 'partsCost',
        nameTh: 'ต้นทุนอะไหล่',
        value: Number(partsPercentage.toFixed(1)),
        amount: Number(totalPartsCost.toFixed(2)),
      });
    }
    
    if (totalLaborCost > 0) {
      breakdown.push({
        name: 'labor',
        nameTh: 'ค่าแรง',
        value: Number(laborPercentage.toFixed(1)),
        amount: Number(totalLaborCost.toFixed(2)),
      });
    }

    res.json({
      status: 'success',
      data: breakdown,
    });
  } catch (error) {
    console.error('Get expense breakdown error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch expense breakdown',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get recent transactions
router.get('/transactions', async (req, res) => {
  try {
    const { timeRange = '6m', type = 'all', limit = 50 } = req.query;
    const { startDate, endDate } = getDateRange(timeRange as string);

    const repairRepository = AppDataSource.getRepository(Repair);
    const partRepository = AppDataSource.getRepository(Part);

    const transactions: any[] = [];

    // Get completed repairs (income transactions)
    if (type === 'all' || type === 'income') {
      const completedRepairs = await repairRepository
        .createQueryBuilder('repair')
        .where('repair.status = :status', { status: RepairStatus.COMPLETED })
        .andWhere(
          '(repair.completedDate BETWEEN :startDate AND :endDate OR (repair.completedDate IS NULL AND repair.updatedAt BETWEEN :startDate AND :endDate))',
          { startDate, endDate }
        )
        .leftJoinAndSelect('repair.customer', 'customer')
        .orderBy('repair.completedDate', 'DESC', 'NULLS LAST')
        .addOrderBy('repair.updatedAt', 'DESC')
        .take(Number(limit))
        .getMany();

      console.log(`[Transactions] Found ${completedRepairs.length} completed repairs for income transactions`);

      completedRepairs.forEach((repair) => {
        const amount = Number(repair.repairSummaryPrice || repair.totalCost || 0);
        if (amount > 0) {
          // Use completedDate if available, otherwise use updatedAt
          const transactionDate = repair.completedDate 
            ? new Date(repair.completedDate)
            : new Date(repair.updatedAt);
          
          transactions.push({
            id: `TXN-${repair.repairNumber || repair.id.substring(0, 8)}`,
            type: 'income',
            description: `Repair Payment - ${repair.repairNumber || 'N/A'}`,
            descriptionTh: `ชำระค่าซ่อม - ${repair.repairNumber || 'N/A'}`,
            amount: parseFloat(amount.toFixed(2)),
            date: transactionDate.toISOString().split('T')[0],
            method: 'Cash', // Default, you can add payment method to Repair entity later
            methodTh: 'เงินสด',
            repairId: repair.id,
          });
        }
      });
    }

    // Get parts purchases (expense transactions)
    if (type === 'all' || type === 'expense') {
      // 1. ดึงธุรกรรมจากอะไหล่ที่เพิ่มในคลัง (ราคาทุน)
      // ดึงอะไหล่ทั้งหมดที่มีสต็อกและราคาทุน (ไม่จำกัดช่วงเวลา เพื่อให้มีข้อมูลแสดง)
      // แต่จะกรองตามวันที่สร้างหรืออัพเดท
      const allPartsWithStock = await partRepository
        .createQueryBuilder('part')
        .where('part.stockQuantity > 0')
        .andWhere('part.costPrice > 0')
        .orderBy('part.createdAt', 'DESC')
        .getMany();

      console.log(`[Transactions] Found ${allPartsWithStock.length} parts with stock`);

      // สร้าง transaction สำหรับอะไหล่ที่สร้างหรืออัพเดทในช่วงเวลาที่เลือก
      // หรือถ้าไม่มีอะไหล่ในช่วงเวลาที่เลือก ให้แสดงอะไหล่ทั้งหมดที่มีสต็อก (ใช้ createdAt เป็นวันที่)
      let partsInTimeRange = 0;
      allPartsWithStock.forEach((part) => {
        const partCreatedDate = new Date(part.createdAt);
        const partUpdatedDate = new Date(part.updatedAt);
        
        // ตรวจสอบว่าอะไหล่นี้สร้างหรืออัพเดทในช่วงเวลาที่เลือก
        const isInTimeRange = 
          (partCreatedDate >= startDate && partCreatedDate <= endDate) ||
          (partUpdatedDate >= startDate && partUpdatedDate <= endDate);
        
        if (isInTimeRange) {
          partsInTimeRange++;
        }
      });

      // ถ้ามีอะไหล่ในช่วงเวลาที่เลือก ให้แสดงเฉพาะอะไหล่ในช่วงเวลานั้น
      // ถ้าไม่มี ให้แสดงอะไหล่ทั้งหมดที่มีสต็อก (เพื่อให้มีข้อมูลแสดง)
      const partsToShow = partsInTimeRange > 0 
        ? allPartsWithStock.filter((part) => {
            const partCreatedDate = new Date(part.createdAt);
            const partUpdatedDate = new Date(part.updatedAt);
            return (partCreatedDate >= startDate && partCreatedDate <= endDate) ||
                   (partUpdatedDate >= startDate && partUpdatedDate <= endDate);
          })
        : allPartsWithStock.slice(0, 20); // แสดงสูงสุด 20 รายการถ้าไม่มีในช่วงเวลา

      console.log(`[Transactions] Showing ${partsToShow.length} parts (${partsInTimeRange} in time range)`);

      // ใช้ Map เพื่อนับลำดับของ transactions ต่อวัน
      const partDateCounter = new Map<string, number>();

      partsToShow.forEach((part) => {
        const costPrice = Number(part.costPrice || 0);
        const stockQty = Number(part.stockQuantity || 0);
        const totalCost = costPrice * stockQty;
        
        if (totalCost > 0) {
          const partName = part.nameTh || part.name;
          const partCreatedDate = new Date(part.createdAt);
          const partUpdatedDate = new Date(part.updatedAt);
          
          // ใช้วันที่ที่สร้างใหม่หรืออัพเดทล่าสุด
          let transactionDate: Date;
          if (partCreatedDate >= startDate && partCreatedDate <= endDate) {
            transactionDate = partCreatedDate;
          } else if (partUpdatedDate >= startDate && partUpdatedDate <= endDate) {
            transactionDate = partUpdatedDate;
          } else {
            // ถ้าไม่อยู่ในช่วงเวลา ให้ใช้ createdAt
            transactionDate = partCreatedDate;
          }
          
          // สร้าง Transaction ID ที่สั้นและอ่านง่าย (ใช้วันที่ + ลำดับ) รูปแบบเหมือน TXN-REP-2026-001
          const dateStr = transactionDate.toISOString().split('T')[0]; // YYYY-MM-DD
          const dateKey = dateStr.replace(/-/g, ''); // YYYYMMDD สำหรับนับลำดับ
          const counter = (partDateCounter.get(dateKey) || 0) + 1;
          partDateCounter.set(dateKey, counter);
          
          transactions.push({
            id: `PART-${dateStr}-${counter}`,
            type: 'expense',
            description: `Part Purchase - ${part.name} (${stockQty} units)`,
            descriptionTh: `ซื้ออะไหล่ - ${partName} (${stockQty} ชิ้น)`,
            amount: parseFloat(totalCost.toFixed(2)),
            date: transactionDate.toISOString().split('T')[0],
            method: 'Transfer',
            methodTh: 'โอนเงิน',
            partId: part.id,
          });
        }
      });

      // 2. ดึงธุรกรรมจากอะไหล่ที่ใช้ในงานซ่อม (ต้นทุนจริง)
      const allRepairs = await repairRepository
        .createQueryBuilder('repair')
        .where(
          '(repair.completedDate BETWEEN :startDate AND :endDate OR (repair.completedDate IS NULL AND repair.updatedAt BETWEEN :startDate AND :endDate))',
          { startDate, endDate }
        )
        .orderBy('repair.completedDate', 'DESC', 'NULLS LAST')
        .addOrderBy('repair.updatedAt', 'DESC')
        .take(Number(limit))
        .getMany();

      // วนลูปผ่านงานซ่อมแต่ละงานเพื่อสร้าง transaction สำหรับอะไหล่ที่ใช้
      for (const repair of allRepairs) {
        const repairDate = repair.completedDate 
          ? new Date(repair.completedDate)
          : new Date(repair.updatedAt);
        
        let repairPartIds: string[] = [];
        if (repair.selectedPartIds) {
          try {
            const ids = JSON.parse(repair.selectedPartIds);
            if (Array.isArray(ids)) {
              repairPartIds = ids;
            }
          } catch (error) {
            console.error('Error parsing selectedPartIds:', error);
          }
        } else if (repair.selectedPartId) {
          repairPartIds = [repair.selectedPartId];
        }

        if (repairPartIds.length > 0) {
          const uniquePartIds = [...new Set(repairPartIds)];
          const parts = await partRepository.find({
            where: { id: In(uniquePartIds) },
          });

          const partCounts: Record<string, number> = {};
          repairPartIds.forEach((id) => {
            partCounts[id] = (partCounts[id] || 0) + 1;
          });

          // นับลำดับของ parts ที่ใช้ใน repair เดียวกัน
          let partIndex = 0;
          parts.forEach((part) => {
            const count = partCounts[part.id] || 0;
            if (count > 0) {
              partIndex++;
              const costPrice = Number(part.costPrice || 0);
              const totalCost = costPrice * count;
              const partName = part.nameTh || part.name;
              transactions.push({
                id: `EXP-${repair.repairNumber || 'N/A'}-${partIndex}`,
                type: 'expense',
                description: `Parts Used - ${part.name} (${count} units) - Repair ${repair.repairNumber || 'N/A'}`,
                descriptionTh: `อะไหล่ที่ใช้ - ${partName} (${count} ชิ้น) - งานซ่อม ${repair.repairNumber || 'N/A'}`,
                amount: parseFloat(totalCost.toFixed(2)),
                date: repairDate.toISOString().split('T')[0],
                method: 'Transfer',
                methodTh: 'โอนเงิน',
                partId: part.id,
                repairId: repair.id,
              });
            }
          });
        }
      }
    }

    // Sort by date descending and limit
    transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    const limitedTransactions = transactions.slice(0, Number(limit));

    console.log(`[Transactions] Total transactions found: ${transactions.length}, returning ${limitedTransactions.length} transactions`);

    res.json({
      status: 'success',
      data: limitedTransactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
