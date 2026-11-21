import mongoose from 'mongoose';
import { Investment, IInvestment, AssetClass } from '../models/Investment';
import { Transaction } from '../models/Transaction';
import { summaryCache } from '../utils/cache';

export interface CreateInvestmentDTO {
  name: string;
  symbol?: string;
  assetClass: AssetClass;
  quantity: number;
  buyPrice: number;
  currentPrice?: number;
  currency?: string;
  purchaseDate?: string | Date;
  notes?: string;
  recordAsExpense?: boolean; // Optionally create an expense in transactions
}

export class InvestmentService {
  /**
   * Fetch all user investments with computed P&L and portfolio allocation summary
   */
  async getUserPortfolio(userId: string) {
    const rawHoldings = await Investment.find({ userId }).sort({ createdAt: -1 });

    let totalInvested = 0;
    let totalCurrentValue = 0;

    const allocationMap = new Map<AssetClass, number>();

    const holdings = rawHoldings.map((item) => {
      const invested = item.quantity * item.buyPrice;
      const current = item.quantity * item.currentPrice;
      const gainLoss = current - invested;
      const returnPct = invested > 0 ? (gainLoss / invested) * 100 : 0;

      totalInvested += invested;
      totalCurrentValue += current;

      const currentAlloc = allocationMap.get(item.assetClass) || 0;
      allocationMap.set(item.assetClass, currentAlloc + current);

      return {
        _id: item._id,
        name: item.name,
        symbol: item.symbol,
        assetClass: item.assetClass,
        quantity: item.quantity,
        buyPrice: item.buyPrice,
        currentPrice: item.currentPrice,
        investedAmount: invested,
        currentValue: current,
        gainLoss,
        returnPercentage: Math.round(returnPct * 100) / 100,
        currency: item.currency,
        purchaseDate: item.purchaseDate,
        notes: item.notes,
        updatedAt: item.updatedAt,
      };
    });

    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalReturnPercentage =
      totalInvested > 0 ? Math.round(((totalGainLoss / totalInvested) * 100) * 100) / 100 : 0;

    const assetAllocation = Array.from(allocationMap.entries()).map(([assetClass, value]) => ({
      assetClass,
      value: Math.round(value * 100) / 100,
      percentage: totalCurrentValue > 0 ? Math.round((value / totalCurrentValue) * 100) : 0,
    }));

    return {
      summary: {
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
        totalGainLoss: Math.round(totalGainLoss * 100) / 100,
        totalReturnPercentage,
        holdingsCount: holdings.length,
      },
      assetAllocation,
      holdings,
    };
  }

  /**
   * Add a new asset to user's investment portfolio
   */
  async createInvestment(userId: string, data: CreateInvestmentDTO) {
    const currentPrice = data.currentPrice !== undefined ? data.currentPrice : data.buyPrice;
    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();

    const investment = await Investment.create({
      userId,
      name: data.name,
      symbol: data.symbol ? data.symbol.toUpperCase() : undefined,
      assetClass: data.assetClass,
      quantity: data.quantity,
      buyPrice: data.buyPrice,
      currentPrice,
      currency: data.currency || 'INR',
      purchaseDate,
      notes: data.notes,
    });

    // Optionally record as an Investment transaction in the user ledger
    if (data.recordAsExpense) {
      const investedTotal = data.quantity * data.buyPrice;
      await Transaction.create({
        userId: new mongoose.Types.ObjectId(userId),
        amount: investedTotal,
        type: 'expense',
        category: 'Investment',
        paymentMethod: 'Bank Transfer',
        notes: `Purchased ${data.quantity} units of ${data.name} (${data.symbol || data.assetClass})`,
        date: purchaseDate,
      });

      summaryCache.delete(`summary_${userId}`);
    }

    return investment;
  }

  /**
   * Update holding quantities or market price
   */
  async updateInvestment(
    userId: string,
    id: string,
    data: Partial<CreateInvestmentDTO>
  ) {
    const updated = await Investment.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return updated;
  }

  /**
   * Remove an investment asset from the portfolio
   */
  async deleteInvestment(userId: string, id: string) {
    const deleted = await Investment.findOneAndDelete({ _id: id, userId });
    return !!deleted;
  }

  /**
   * Refresh current prices with simulated or quote fluctuations
   */
  async refreshPrices(userId: string) {
    const holdings = await Investment.find({ userId });
    for (const h of holdings) {
      // Simulate slight +/- 0.5% - 2.5% market variation if live ticker not connected
      const factor = 1 + (Math.random() * 0.04 - 0.015);
      h.currentPrice = Math.round(h.currentPrice * factor * 100) / 100;
      await h.save();
    }
    return this.getUserPortfolio(userId);
  }
}

export const investmentService = new InvestmentService();

