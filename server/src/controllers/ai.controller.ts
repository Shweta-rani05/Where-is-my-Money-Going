import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { Goal } from '../models/Goal';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────
interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  topCategories: { category: string; total: number }[];
  budgetStatuses: { category: string; limit: number; spent: number; percentage: number }[];
  goalStatuses: { title: string; target: number; saved: number; percentage: number }[];
  recentTransactions: { description: string; amount: number; type: string; category: string; date: string }[];
}

// ────────────────────────────────────────────
// Helper: Aggregate financial data for a user
// ────────────────────────────────────────────
async function buildFinancialSummary(userId: string): Promise<FinancialSummary> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [transactions, budgets, goals] = await Promise.all([
    Transaction.find({ userId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).lean(),
    Budget.find({ userId }).lean(),
    Goal.find({ userId }).lean()
  ]);

  const totalIncome = transactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // Top spending categories
  const categoryMap: Record<string, number> = {};
  transactions
    .filter((t: any) => t.type === 'expense')
    .forEach((t: any) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, total]) => ({ category, total }));

  // Budget statuses
  const budgetStatuses = budgets.map((b: any) => {
    const spent = transactions
      .filter((t: any) => t.type === 'expense' && t.category === b.category)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    return {
      category: b.category,
      limit: b.limit,
      spent,
      percentage: b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0
    };
  });

  // Goal statuses
  const goalStatuses = goals.map((g: any) => ({
    title: g.title,
    target: g.targetAmount,
    saved: g.savedAmount,
    percentage: g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0
  }));

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5).map((t: any) => ({
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: new Date(t.date).toLocaleDateString('en-IN')
  }));

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    topCategories,
    budgetStatuses,
    goalStatuses,
    recentTransactions
  };
}

// ────────────────────────────────────────────
// Rule-Based Insight Engine
// ────────────────────────────────────────────
function generateRuleBasedResponse(message: string, summary: FinancialSummary): string {
  const lowerMsg = message.toLowerCase();

  // Spending summary
  if (lowerMsg.includes('spending') || lowerMsg.includes('summary') || lowerMsg.includes('overview')) {
    if (summary.transactionCount === 0) {
      return `📊 **Financial Overview**\n\nYou don't have any transactions recorded in the last 30 days. Start adding your income and expenses to get personalized insights!\n\n💡 **Tip:** Head over to the Transactions page to log your first entry.`;
    }

    let response = `📊 **Your 30-Day Financial Summary**\n\n`;
    response += `• **Total Income:** ₹${summary.totalIncome.toLocaleString()}\n`;
    response += `• **Total Expenses:** ₹${summary.totalExpenses.toLocaleString()}\n`;
    response += `• **Net Balance:** ₹${summary.netBalance.toLocaleString()}\n`;
    response += `• **Transactions:** ${summary.transactionCount} recorded\n\n`;

    if (summary.netBalance > 0) {
      response += `✅ You're in a **surplus** of ₹${summary.netBalance.toLocaleString()}. Great financial discipline!`;
    } else if (summary.netBalance < 0) {
      response += `⚠️ You're in a **deficit** of ₹${Math.abs(summary.netBalance).toLocaleString()}. Consider reducing discretionary spending.`;
    } else {
      response += `⚖️ You're **breaking even** — your income exactly matches your expenses.`;
    }

    return response;
  }

  // Budget status
  if (lowerMsg.includes('budget')) {
    if (summary.budgetStatuses.length === 0) {
      return `📋 **Budget Status**\n\nYou haven't set up any budgets yet. Create monthly budgets on the Budgets page to track your spending limits by category.\n\n💡 **Tip:** Start with your top spending categories to see immediate impact!`;
    }

    let response = `📋 **Budget Status Report**\n\n`;
    const overBudget = summary.budgetStatuses.filter(b => b.percentage > 100);
    const nearLimit = summary.budgetStatuses.filter(b => b.percentage >= 75 && b.percentage <= 100);
    const onTrack = summary.budgetStatuses.filter(b => b.percentage < 75);

    if (overBudget.length > 0) {
      response += `🔴 **Over Budget (${overBudget.length}):**\n`;
      overBudget.forEach(b => {
        response += `• ${b.category}: ₹${b.spent.toLocaleString()} / ₹${b.limit.toLocaleString()} (${b.percentage}%)\n`;
      });
      response += '\n';
    }

    if (nearLimit.length > 0) {
      response += `🟡 **Near Limit (${nearLimit.length}):**\n`;
      nearLimit.forEach(b => {
        response += `• ${b.category}: ₹${b.spent.toLocaleString()} / ₹${b.limit.toLocaleString()} (${b.percentage}%)\n`;
      });
      response += '\n';
    }

    if (onTrack.length > 0) {
      response += `🟢 **On Track (${onTrack.length}):**\n`;
      onTrack.forEach(b => {
        response += `• ${b.category}: ₹${b.spent.toLocaleString()} / ₹${b.limit.toLocaleString()} (${b.percentage}%)\n`;
      });
    }

    return response;
  }

  // Savings/Goals progress
  if (lowerMsg.includes('saving') || lowerMsg.includes('goal')) {
    if (summary.goalStatuses.length === 0) {
      return `🎯 **Savings Goals**\n\nYou haven't set any savings goals yet. Define targets like "Emergency Fund" or "Vacation Trip" on the Goals page to start tracking progress.\n\n💡 **Tip:** Even small regular deposits compound over time!`;
    }

    let response = `🎯 **Savings Goals Progress**\n\n`;
    summary.goalStatuses.forEach(g => {
      const bar = g.percentage >= 100 ? '🎉' : g.percentage >= 50 ? '📈' : '📊';
      response += `${bar} **${g.title}**: ₹${g.saved.toLocaleString()} / ₹${g.target.toLocaleString()} (${g.percentage}%)\n`;
    });

    const totalSaved = summary.goalStatuses.reduce((sum, g) => sum + g.saved, 0);
    const totalTarget = summary.goalStatuses.reduce((sum, g) => sum + g.target, 0);
    response += `\n**Overall:** ₹${totalSaved.toLocaleString()} saved of ₹${totalTarget.toLocaleString()} total target`;

    return response;
  }

  // Top expenses
  if (lowerMsg.includes('top') || lowerMsg.includes('expensive') || lowerMsg.includes('categor')) {
    if (summary.topCategories.length === 0) {
      return `📂 **Top Spending Categories**\n\nNo expense data found in the last 30 days. Log some transactions to see where your money is going!`;
    }

    let response = `📂 **Top Spending Categories (Last 30 Days)**\n\n`;
    summary.topCategories.forEach((c, i) => {
      const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
      const pct = summary.totalExpenses > 0 ? Math.round((c.total / summary.totalExpenses) * 100) : 0;
      response += `${emoji} **${c.category}**: ₹${c.total.toLocaleString()} (${pct}% of total)\n`;
    });

    return response;
  }

  // Recent transactions
  if (lowerMsg.includes('recent') || lowerMsg.includes('latest') || lowerMsg.includes('transaction')) {
    if (summary.recentTransactions.length === 0) {
      return `📝 **Recent Transactions**\n\nNo transactions found. Head to the Transactions page to start logging your income and expenses.`;
    }

    let response = `📝 **Recent Transactions**\n\n`;
    summary.recentTransactions.forEach(t => {
      const icon = t.type === 'income' ? '💰' : '💸';
      response += `${icon} ${t.description} — ₹${t.amount.toLocaleString()} (${t.category}) on ${t.date}\n`;
    });

    return response;
  }

  // Advice / tips
  if (lowerMsg.includes('advice') || lowerMsg.includes('tip') || lowerMsg.includes('help') || lowerMsg.includes('suggest')) {
    let response = `💡 **Financial Tips Based on Your Data**\n\n`;

    if (summary.netBalance < 0) {
      response += `1. **Reduce deficit:** You're spending ₹${Math.abs(summary.netBalance).toLocaleString()} more than you earn. Review discretionary categories.\n`;
    }

    const overBudgets = summary.budgetStatuses.filter(b => b.percentage > 100);
    if (overBudgets.length > 0) {
      response += `2. **Budget alerts:** ${overBudgets.length} budget(s) are exceeded. Focus on ${overBudgets.map(b => b.category).join(', ')}.\n`;
    }

    const lowGoals = summary.goalStatuses.filter(g => g.percentage < 25);
    if (lowGoals.length > 0) {
      response += `3. **Boost savings:** ${lowGoals.map(g => g.title).join(', ')} need attention — they're below 25% progress.\n`;
    }

    if (summary.topCategories.length > 0) {
      response += `4. **Biggest expense:** "${summary.topCategories[0].category}" takes the largest share. Consider if you can optimize here.\n`;
    }

    response += `5. **Consistency:** Log transactions daily for the most accurate financial picture.\n`;

    return response;
  }

  // Default / greeting
  return `👋 **Hello! I'm your financial assistant.**\n\nI can help you understand your finances. Try asking me:\n\n• "What's my spending summary?"\n• "How are my budgets doing?"\n• "Show my savings progress"\n• "What are my top expense categories?"\n• "Give me financial tips"\n• "Show recent transactions"\n\nI analyze your actual data from the last 30 days to provide personalized insights!`;
}

// ────────────────────────────────────────────
// Optional: Gemini API Integration
// ────────────────────────────────────────────
async function callGeminiAPI(message: string, summary: FinancialSummary): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const systemPrompt = `You are a helpful personal finance assistant for the "Where Is My Money Going?" app. 
The user's financial data from the last 30 days:
- Total Income: ₹${summary.totalIncome.toLocaleString()}
- Total Expenses: ₹${summary.totalExpenses.toLocaleString()}  
- Net Balance: ₹${summary.netBalance.toLocaleString()}
- Transaction Count: ${summary.transactionCount}
- Top Spending Categories: ${summary.topCategories.map(c => `${c.category}: ₹${c.total.toLocaleString()}`).join(', ') || 'None'}
- Budgets: ${summary.budgetStatuses.map(b => `${b.category}: ₹${b.spent.toLocaleString()}/₹${b.limit.toLocaleString()} (${b.percentage}%)`).join(', ') || 'None set'}
- Savings Goals: ${summary.goalStatuses.map(g => `${g.title}: ₹${g.saved.toLocaleString()}/₹${g.target.toLocaleString()} (${g.percentage}%)`).join(', ') || 'None set'}

Provide concise, actionable, and encouraging financial advice. Use markdown formatting and emojis. Keep responses under 300 words. Use ₹ for currency.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: message }] }]
        })
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (error) {
    console.error('[AI] Gemini API call failed:', error);
    return null;
  }
}

// ────────────────────────────────────────────
// Controller: POST /api/ai/chat
// ────────────────────────────────────────────
/**
 * @route   POST /api/ai/chat
 * @desc    Processes a user message and returns financial insights.
 * @access  Private
 */
export const chatWithAI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { message } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ status: 'fail', message: 'Message is required.' });
      return;
    }

    // Build financial context
    const summary = await buildFinancialSummary(userId.toString());

    // Try Gemini first, fallback to rule-based
    let response = await callGeminiAPI(message.trim(), summary);

    if (!response) {
      response = generateRuleBasedResponse(message.trim(), summary);
    }

    res.status(200).json({
      status: 'success',
      data: {
        response,
        mode: process.env.GEMINI_API_KEY ? 'gemini' : 'rule-based'
      }
    });
  } catch (error) {
    next(error);
  }
};
