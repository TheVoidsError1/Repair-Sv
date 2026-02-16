import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { Transaction } from '../entities/Transaction.js';
import { Part } from '../entities/Part.js';

const router = Router();

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const partRepository = AppDataSource.getRepository(Part);
    
    const transaction = await transactionRepository.findOne({
      where: { id },
      relations: ['part'],
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    // ถ้าเป็น transaction ประเภท purchase (การซื้อสต็อก) ให้คืนสต็อกกลับ
    if (transaction.type === 'purchase' && transaction.partId) {
      const part = await partRepository.findOne({ where: { id: transaction.partId } });
      if (part) {
        // คืนสต็อกกลับ (ลบจำนวนที่เพิ่มไป)
        const quantityToRestore = transaction.quantityAdded || 0;
        if (part.stockQuantity >= quantityToRestore) {
          part.stockQuantity -= quantityToRestore;
          await partRepository.save(part);
        } else {
          // ถ้าสต็อกปัจจุบันน้อยกว่าจำนวนที่จะคืน ให้ตั้งเป็น 0
          part.stockQuantity = 0;
          await partRepository.save(part);
        }
      }
    }

    // ลบ transaction
    await transactionRepository.remove(transaction);

    res.json({
      status: 'success',
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete transaction',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
