import { Transaction } from '../models/Transaction';
import { ParsedTransaction } from './llm.service';

export const duplicateService = {
  /**
   * Filters out transactions that already exist in the database to ensure idempotency.
   * Matches based on exact amount, type, and same calendar date.
   * 
   * @param userId The user ID
   * @param parsedTransactions The array of parsed transactions from the LLM
   * @returns An array of uniquely new transactions
   */
  filterNewTransactions: async (userId: string, parsedTransactions: ParsedTransaction[]): Promise<ParsedTransaction[]> => {
    if (parsedTransactions.length === 0) return [];

    // Find the min and max dates from the parsed batch to narrow the database query
    const dates = parsedTransactions.map(t => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Expand the window by 1 day on each side to account for timezone shifts
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);

    // Fetch all existing transactions in that date range for this user
    const existingTransactions = await Transaction.find({
      userId,
      date: {
        $gte: minDate,
        $lte: maxDate
      }
    }).lean();

    const newTransactions: ParsedTransaction[] = [];

    for (const parsed of parsedTransactions) {
      const parsedDate = new Date(parsed.date);
      const parsedDateString = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD

      // Check if there is a matching existing transaction
      const isDuplicate = existingTransactions.some(existing => {
        const existingDateString = new Date(existing.date).toISOString().split('T')[0];
        
        // A duplicate is defined as having the same date (YYYY-MM-DD), same amount, and same type
        return (
          existingDateString === parsedDateString &&
          existing.amount === parsed.amount &&
          existing.type === parsed.type
        );
      });

      if (!isDuplicate) {
        newTransactions.push(parsed);
      }
    }

    return newTransactions;
  }
};
