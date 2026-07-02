import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { Goal } from '../models/Goal';
import { AIHistory } from '../models/AIHistory';
import { GoogleGenAI } from '@google/genai';
import { withRetry } from '../services/llm.service';
// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────
interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  topCategories: { category: string; total: number }[];
  topMerchants: { merchant: string; total: number }[];
  budgetStatuses: { category: string; limit: number; spent: number; percentage: number }[];
  goalStatuses: { title: string; target: number; saved: number; percentage: number }[];
  recentTransactions: { description: string; amount: number; type: string; category: string; date: string }[];
  anomalies: string[];
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
  const merchantMap: Record<string, number> = {};
  const amountFrequency: Record<number, number> = {};

  transactions
    .filter((t: any) => t.type === 'expense')
    .forEach((t: any) => {
      // Categories
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      
      // Merchants (using notes as a proxy for merchant from OCR)
      if (t.notes) {
        const merchant = t.notes.split(' ')[0].substring(0, 15).toUpperCase();
        merchantMap[merchant] = (merchantMap[merchant] || 0) + t.amount;
      }

      // Track recurring amounts for anomaly detection
      amountFrequency[t.amount] = (amountFrequency[t.amount] || 0) + 1;
    });

  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, total]) => ({ category, total }));

  const topMerchants = Object.entries(merchantMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([merchant, total]) => ({ merchant, total }));

  // Detect simple anomalies (recurring identical large expenses)
  const anomalies: string[] = [];
  Object.entries(amountFrequency).forEach(([amountStr, count]) => {
    const amount = Number(amountStr);
    if (count >= 2 && amount > 1000) {
      anomalies.push(`Recurring large expense detected: ₹${amount} was spent ${count} times.`);
    }
  });

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

  // Recent transactions (expand to last 20 for better LLM context)
  const recentTransactions = transactions.slice(0, 20).map((t: any) => ({
    description: t.notes || t.description || 'Unknown',
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: new Date(t.date).toISOString().split('T')[0]
  }));

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    topCategories,
    topMerchants,
    budgetStatuses,
    goalStatuses,
    recentTransactions,
    anomalies
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
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a helpful personal finance assistant for the "Where Is My Money Going?" app. 
The user recently uploaded bank statements. Here is their financial data from the last 30 days:
- Total Income: ₹${summary.totalIncome.toLocaleString()}
- Total Expenses: ₹${summary.totalExpenses.toLocaleString()}  
- Net Balance: ₹${summary.netBalance.toLocaleString()}
- Transaction Count: ${summary.transactionCount}
- Top Spending Categories: ${summary.topCategories.map(c => `${c.category}: ₹${c.total.toLocaleString()}`).join(', ') || 'None'}
- Top Merchants: ${summary.topMerchants.map(m => `${m.merchant}: ₹${m.total.toLocaleString()}`).join(', ') || 'None'}
- Spending Anomalies detected: ${summary.anomalies.join(' | ') || 'None'}
- Budgets: ${summary.budgetStatuses.map(b => `${b.category}: ₹${b.spent.toLocaleString()}/₹${b.limit.toLocaleString()} (${b.percentage}%)`).join(', ') || 'None set'}
- Savings Goals: ${summary.goalStatuses.map(g => `${g.title}: ₹${g.saved.toLocaleString()}/₹${g.target.toLocaleString()} (${g.percentage}%)`).join(', ') || 'None set'}

Here are their last 20 transactions for context (Merchant/Desc, Amount, Category, Date):
${summary.recentTransactions.map(t => `${t.description}: ₹${t.amount} (${t.category}) on ${t.date}`).join('\n')}

Provide concise, actionable, and encouraging financial advice based on the user's prompt. Answer specific questions about merchants (like Zomato, Swiggy) using the transaction list above. Use markdown formatting and emojis. Keep responses under 300 words. Use ₹ for currency.`;

    const response = await withRetry(() => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [message],
        config: {
          systemInstruction: systemPrompt
        }
      })
    );

    return response.text || null;
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

    // Save to history
    await AIHistory.create({
      userId,
      prompt: message.trim(),
      response
    });

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

// ────────────────────────────────────────────
// Controller: GET /api/ai/history
// ────────────────────────────────────────────
/**
 * @route   GET /api/ai/history
 * @desc    Get user's AI chat history
 * @access  Private
 */
export const getChatHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const history = await AIHistory.find({ userId }).sort({ createdAt: 1 }).lean();

    res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// AI Insights Engine
// ────────────────────────────────────────────

async function generateGeminiInsights(summary: FinancialSummary): Promise<any | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert financial advisor for the "Where Is My Money Going?" app.
The user's financial data from the last 30 days:
- Total Income: ₹${summary.totalIncome}
- Total Expenses: ₹${summary.totalExpenses}
- Net Balance: ₹${summary.netBalance}
- Top Categories: ${JSON.stringify(summary.topCategories)}
- Top Merchants: ${JSON.stringify(summary.topMerchants)}
- Anomalies: ${JSON.stringify(summary.anomalies)}
- Budgets: ${JSON.stringify(summary.budgetStatuses)}
- Goals: ${JSON.stringify(summary.goalStatuses)}

Analyze this data and return a JSON object exactly with these 4 keys (no markdown formatting, just pure JSON):
{
  "analyzeSpending": "A short 2-3 sentence analysis of their spending habits.",
  "budgetSuggestions": "A short 2-3 sentence suggestion on how to adjust or set budgets.",
  "expenseTrends": "A short 2-3 sentence observation about their expense trends.",
  "savingsTips": "A short 2-3 sentence tip to help them save more for their goals."
}`;

    const response = await withRetry(() => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [systemPrompt],
        config: {
          systemInstruction: "You must return valid JSON only.",
          responseMimeType: "application/json"
        }
      })
    );

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error('[AI] Gemini Insights generation failed:', error);
    return null;
  }
}

function generateRuleBasedInsights(summary: FinancialSummary): any {
  return {
    analyzeSpending: summary.totalExpenses > summary.totalIncome 
      ? `You spent ₹${summary.totalExpenses.toLocaleString()}, which is more than your income of ₹${summary.totalIncome.toLocaleString()}. Try to cut down on discretionary expenses.`
      : `You spent ₹${summary.totalExpenses.toLocaleString()} this month, keeping your expenses below your income. Great job maintaining a surplus!`,
      
    budgetSuggestions: summary.budgetStatuses.length === 0
      ? "You haven't set any budgets yet. Consider setting a budget for your top spending categories to keep expenses in check."
      : `You have ${summary.budgetStatuses.filter(b => b.percentage >= 100).length} budgets that are over the limit. Review these categories and adjust your spending or limits accordingly.`,
      
    expenseTrends: summary.topCategories.length > 0
      ? `Your highest expense category is ${summary.topCategories[0].category} at ₹${summary.topCategories[0].total.toLocaleString()}. Monitoring this can significantly reduce overall spend.`
      : "You haven't logged enough transactions this month to identify major expense trends.",
      
    savingsTips: summary.goalStatuses.length > 0
      ? `You are making progress on your goals! Consider automating a transfer of ₹${(summary.totalIncome * 0.1).toLocaleString()} (10% of income) to reach them faster.`
      : "Setting a specific savings goal, like an Emergency Fund, can motivate you to save more consistently."
  };
}

/**
 * @route   GET /api/ai/insights
 * @desc    Get structured AI financial insights
 * @access  Private
 */
export const getInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const summary = await buildFinancialSummary(userId.toString());
    
    let insights = await generateGeminiInsights(summary);
    
    if (!insights) {
      insights = generateRuleBasedInsights(summary);
    }

    res.status(200).json({
      status: 'success',
      data: insights
    });
  } catch (error) {
    next(error);
  }
};


