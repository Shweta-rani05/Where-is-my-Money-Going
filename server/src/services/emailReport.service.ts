import mongoose from 'mongoose';
import { Resend } from 'resend';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';

interface ReportParams {
  userId: string;
  month?: number; // 1 - 12
  year?: number;
}

interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  budgetLimit?: number;
  isOverBudget?: boolean;
}

export class EmailReportService {
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  /**
   * Aggregate monthly transaction data, compare with budgets, and construct summary metrics.
   */
  async generateMonthlyReportData(userId: string, month?: number, year?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month ? month - 1 : now.getMonth(); // 0-indexed for Date

    const startDate = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

    const monthName = startDate.toLocaleString('en-US', { month: 'long' });

    const user = await User.findById(userId).select('name email');
    if (!user) {
      throw new Error('User not found');
    }

    // 1. Aggregate income and expenses for this month
    const totalsResult = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalIncome = totalsResult[0]?.totalIncome || 0;
    const totalExpense = totalsResult[0]?.totalExpense || 0;
    const transactionCount = totalsResult[0]?.count || 0;
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // 2. Aggregate category breakdown for expenses
    const categoryResult = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    // 3. Fetch user budgets to correlate with category spending
    const budgets = await Budget.find({ userId });
    const budgetMap = new Map<string, number>();
    budgets.forEach((b) => budgetMap.set(b.category, b.limit));

    const categoryBreakdown: CategorySummary[] = categoryResult.map((c) => {
      const budgetLimit = budgetMap.get(c._id);
      return {
        category: c._id,
        amount: c.amount,
        percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
        budgetLimit,
        isOverBudget: budgetLimit ? c.amount > budgetLimit : false,
      };
    });

    // 4. Fetch Top 5 biggest expenses
    const topExpenses = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ amount: -1 })
      .limit(5)
      .select('notes category amount date paymentMethod');

    // Generate analytical key takeaway
    let keyTakeaway = 'You had balanced finances this month!';
    if (categoryBreakdown.length > 0) {
      const topCat = categoryBreakdown[0];
      keyTakeaway = `Your highest spending category was ${topCat.category} at ₹${topCat.amount.toLocaleString(
        'en-IN'
      )} (${topCat.percentage}% of all expenses).`;
      const overBudgets = categoryBreakdown.filter((c) => c.isOverBudget);
      if (overBudgets.length > 0) {
        keyTakeaway += ` Warning: ${overBudgets.map((b) => b.category).join(', ')} exceeded budget limits!`;
      }
    }

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      period: {
        month: targetMonth + 1,
        monthName,
        year: targetYear,
      },
      metrics: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        transactionCount,
      },
      categoryBreakdown,
      topExpenses,
      keyTakeaway,
    };
  }

  /**
   * Generate high-quality responsive HTML email template
   */
  generateHtmlTemplate(data: Awaited<ReturnType<typeof this.generateMonthlyReportData>>) {
    const { user, period, metrics, categoryBreakdown, topExpenses, keyTakeaway } = data;

    const netSavingsFormatted = (metrics.netSavings >= 0 ? '+' : '-') + '₹' + Math.abs(metrics.netSavings).toLocaleString('en-IN');
    const netSavingsColor = metrics.netSavings >= 0 ? '#10B981' : '#EF4444';

    const categoryRows = categoryBreakdown.length
      ? categoryBreakdown
          .map((c) => {
            const budgetNotice = c.budgetLimit
              ? `<span style="font-size: 11px; color: ${
                  c.isOverBudget ? '#EF4444' : '#6B7280'
                };">Budget: ₹${c.budgetLimit.toLocaleString('en-IN')} ${
                  c.isOverBudget ? '⚠️ Exceeded' : '✓'
                }</span>`
              : '<span style="font-size: 11px; color: #9CA3AF;">No limit set</span>';

            return `
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 12px 8px; font-weight: 600; color: #1F2937;">${c.category}</td>
              <td style="padding: 12px 8px; text-align: right; color: #111827; font-weight: 600;">₹${c.amount.toLocaleString(
                'en-IN'
              )}</td>
              <td style="padding: 12px 8px; text-align: right; color: #4B5563;">${c.percentage}%</td>
              <td style="padding: 12px 8px; text-align: right;">${budgetNotice}</td>
            </tr>
          `;
          })
          .join('')
      : `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9CA3AF;">No expenses recorded for this month.</td></tr>`;

    const topExpenseRows = topExpenses.length
      ? topExpenses
          .map((item) => {
            const dateStr = new Date(item.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            });
            return `
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 10px 8px; color: #374151;">${item.notes || item.category}</td>
              <td style="padding: 10px 8px; color: #6B7280; font-size: 12px;">${item.category} (${item.paymentMethod})</td>
              <td style="padding: 10px 8px; color: #6B7280; font-size: 12px;">${dateStr}</td>
              <td style="padding: 10px 8px; text-align: right; color: #DC2626; font-weight: 600;">₹${item.amount.toLocaleString(
                'en-IN'
              )}</td>
            </tr>
          `;
          })
          .join('')
      : `<tr><td colspan="4" style="padding: 15px; text-align: center; color: #9CA3AF;">No expense items.</td></tr>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Expense Report</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
                
                <!-- HEADER -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%); padding: 32px 30px; text-align: center;">
                    <div style="font-size: 28px; margin-bottom: 8px;">💰</div>
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Where Is My Money Going?</h1>
                    <p style="color: #C7D2FE; margin: 6px 0 0 0; font-size: 14px;">Monthly Financial Statement &bull; ${period.monthName} ${period.year}</p>
                  </td>
                </tr>

                <!-- GREETING & SUMMARY -->
                <tr>
                  <td style="padding: 30px 30px 20px 30px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; color: #1F2937;">Hello <strong>${user.name}</strong>,</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #4B5563; line-height: 1.5;">
                      Here is your comprehensive monthly financial breakdown for <strong>${period.monthName} ${period.year}</strong>.
                    </p>

                    <!-- METRICS GRID -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <!-- Total Income -->
                        <td width="32%" style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 16px; text-align: center;">
                          <div style="font-size: 12px; color: #065F46; font-weight: 600; text-transform: uppercase;">Total Income</div>
                          <div style="font-size: 20px; font-weight: 700; color: #047857; margin-top: 4px;">₹${metrics.totalIncome.toLocaleString('en-IN')}</div>
                        </td>
                        <td width="2%"></td>
                        <!-- Total Expenses -->
                        <td width="32%" style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; text-align: center;">
                          <div style="font-size: 12px; color: #991B1B; font-weight: 600; text-transform: uppercase;">Total Expenses</div>
                          <div style="font-size: 20px; font-weight: 700; color: #DC2626; margin-top: 4px;">₹${metrics.totalExpense.toLocaleString('en-IN')}</div>
                        </td>
                        <td width="2%"></td>
                        <!-- Net Savings -->
                        <td width="32%" style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px; text-align: center;">
                          <div style="font-size: 12px; color: #1E40AF; font-weight: 600; text-transform: uppercase;">Net Savings</div>
                          <div style="font-size: 20px; font-weight: 700; color: ${netSavingsColor}; margin-top: 4px;">${netSavingsFormatted}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- KEY TAKEAWAY BANNER -->
                    <div style="background-color: #F8FAFC; border-left: 4px solid #6366F1; padding: 12px 16px; border-radius: 6px; margin-bottom: 28px;">
                      <div style="font-size: 12px; font-weight: 700; color: #4338CA; text-transform: uppercase; margin-bottom: 2px;">💡 Key Takeaway</div>
                      <div style="font-size: 13px; color: #334155;">${keyTakeaway}</div>
                    </div>

                    <!-- CATEGORY BREAKDOWN -->
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 700;">Expense Category Breakdown</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; margin-bottom: 28px;">
                      <thead>
                        <tr style="background-color: #F3F4F6; color: #4B5563; font-size: 11px; text-transform: uppercase;">
                          <th style="padding: 10px 8px; text-align: left; border-radius: 6px 0 0 6px;">Category</th>
                          <th style="padding: 10px 8px; text-align: right;">Amount</th>
                          <th style="padding: 10px 8px; text-align: right;">Share</th>
                          <th style="padding: 10px 8px; text-align: right; border-radius: 0 6px 6px 0;">Budget Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${categoryRows}
                      </tbody>
                    </table>

                    <!-- TOP EXPENSES -->
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 700;">Top Expenses This Month</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; margin-bottom: 28px;">
                      <thead>
                        <tr style="background-color: #F3F4F6; color: #4B5563; font-size: 11px; text-transform: uppercase;">
                          <th style="padding: 8px; text-align: left; border-radius: 6px 0 0 6px;">Description</th>
                          <th style="padding: 8px; text-align: left;">Category</th>
                          <th style="padding: 8px; text-align: left;">Date</th>
                          <th style="padding: 8px; text-align: right; border-radius: 0 6px 6px 0;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${topExpenseRows}
                      </tbody>
                    </table>

                    <!-- CTA BUTTON -->
                    <div style="text-align: center; margin: 30px 0 10px 0;">
                      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="background-color: #4F46E5; color: #FFFFFF; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                        Open Dashboard & Analytics
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                      This report was generated automatically by <strong>Where Is My Money Going?</strong> for ${user.email}.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Send the monthly expense report to the user's email via Resend API
   */
  async sendMonthlyReport(params: ReportParams) {
    const reportData = await this.generateMonthlyReportData(
      params.userId,
      params.month,
      params.year
    );

    const html = this.generateHtmlTemplate(reportData);
    const subject = `📊 Your Monthly Financial Report - ${reportData.period.monthName} ${reportData.period.year}`;
    const from = process.env.EMAIL_FROM || 'Where Is My Money Going <onboarding@resend.dev>';

    // If Resend API key is not configured, support dry-run / development simulation
    if (!this.resend) {
      console.warn('⚠️ [EmailReportService] RESEND_API_KEY is not configured in .env. Simulating email send.');
      return {
        success: true,
        simulated: true,
        message: 'Resend API key not set. Email simulated successfully.',
        recipient: reportData.user.email,
        subject,
        reportData,
      };
    }

    try {
      const response = await this.resend.emails.send({
        from,
        to: reportData.user.email,
        subject,
        html,
      });

      return {
        success: true,
        simulated: false,
        id: response.data?.id,
        recipient: reportData.user.email,
        subject,
        reportData,
      };
    } catch (error: any) {
      console.error('❌ [EmailReportService] Failed to send email via Resend:', error);
      throw new Error(error.message || 'Failed to dispatch email report via Resend.');
    }
  }
}

export const emailReportService = new EmailReportService();

