import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { ocrService } from '../services/ocr.service';
import { llmService } from '../services/llm.service';
import { duplicateService } from '../services/duplicate.service';
import { Transaction } from '../models/Transaction';
import { summaryCache } from '../utils/cache';

/**
 * @route   POST /api/statements/upload
 * @desc    Uploads a bank statement, validates it, and extracts raw text/image data
 * @access  Private
 */
export const uploadStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ status: 'fail', message: 'No file uploaded. Please upload a PDF or Image.' });
      return;
    }

    let extracted;
    try {
      // Step 1: Extract content via OCR service
      extracted = await ocrService.extractContent(req.file.path, req.file.mimetype);
    } catch (ocrError: any) {
      // Clean up on OCR failure
      fs.unlink(req.file.path, () => {});
      res.status(400).json({ status: 'fail', message: ocrError.message || 'OCR Extraction failed' });
      return;
    }

    // Clean up: delete the temporary file after successful extraction
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('[Cleanup] Failed to delete temp file:', err);
    });

    if (!extracted || (extracted.type === 'text' && extracted.data.trim().length === 0)) {
      res.status(400).json({ status: 'fail', message: 'The uploaded document contains no readable text.' });
      return;
    }

    // Step 2: Parse raw text/image into JSON using Gemini
    let parsedTransactions;
    try {
      parsedTransactions = await llmService.parseStatement(extracted);
    } catch (llmError: any) {
      // Pass the specific rate limit or other LLM errors to the client
      res.status(500).json({ status: 'error', message: llmError.message || 'Failed to process data with AI.' });
      return;
    }

    if (parsedTransactions.length === 0) {
      res.status(200).json({
        status: 'success',
        message: 'No valid transactions found in the uploaded statement.',
        data: { imported: 0, duplicates: 0 }
      });
      return;
    }

    // Step 3: Filter out duplicates
    const newTransactions = await duplicateService.filterNewTransactions(userId.toString(), parsedTransactions);
    const duplicateCount = parsedTransactions.length - newTransactions.length;

    // Step 4: Bulk insert new transactions into MongoDB
    let insertedCount = 0;
    if (newTransactions.length > 0) {
      const docsToInsert = newTransactions.map(t => ({
        ...t,
        userId,
        date: new Date(t.date) // ensure it is a Date object
      }));

      const result = await Transaction.insertMany(docsToInsert);
      insertedCount = result.length;

      // Invalidate the cache since the ledger has changed
      summaryCache.delete(`summary_${userId}`);
    }

    res.status(200).json({
      status: 'success',
      message: `Statement processed. Imported ${insertedCount} transactions. Found ${duplicateCount} duplicates.`,
      data: {
        imported: insertedCount,
        duplicates: duplicateCount,
        parsedTransactions: newTransactions // Return the newly added ones for UI preview
      }
    });

  } catch (error) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};
