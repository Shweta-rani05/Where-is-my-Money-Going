import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import RecentTransactions from '../components/RecentTransactions';
import BudgetAlerts from '../components/BudgetAlerts';
import { useAuth } from '../context/AuthContext';
import { transactionService, type TransactionSummary } from '../services/transaction.service';
import toast from 'react-hot-toast';

const COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#6b7280'  // Gray
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await transactionService.getTransactionSummary();
        setSummary(data);
      } catch (error: any) {
        toast.error('Failed to load dashboard cashflow summaries.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-text-muted font-medium tracking-wide">
          Calculating financial summaries...
        </span>
      </div>
    );
  }

  // Format stats card metrics with fallbacks
  const totals = summary?.totals || { income: 0, expenses: 0, savings: 0, remainingBudget: 0, hasBudget: false, budgetLimit: 0 };
  
  // Format category distribution to inject palette colors
  const categoryData = summary
    ? summary.categoryDistribution.map((item, index) => ({
        name: item.name,
        value: item.value,
        color: COLORS[index % COLORS.length]
      }))
    : [];

  // Format cashflow trend dataset
  const cashFlowTrend = summary?.cashFlowTrend || [];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-text-muted">
          Welcome back, {user?.name || 'User'}! Here is a summary of your financial status.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Monthly Income"
          value={`₹${totals.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          changeText="Active this month"
          icon={TrendingUp}
          type="income"
        />
        <StatsCard
          title="Monthly Expenses"
          value={`₹${totals.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          changeText="Spent this month"
          isPositive={false}
          icon={TrendingDown}
          type="expense"
        />
        <StatsCard
          title="Net Savings"
          value={`₹${totals.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          changeText="Saved this month"
          icon={PiggyBank}
          type="savings"
        />
        {totals.hasBudget ? (
          <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group shadow-amber-500/5">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-text-muted select-none">
                  Remaining Budget
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-text-custom">
                  ₹{totals.remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 rounded-xl border transition-all duration-300 group-hover:scale-110 bg-amber-500/10 text-amber-500 border-amber-500/20">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2 mt-auto">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-text-muted">Spent: ₹{totals.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="text-text-muted">Limit: ₹{totals.budgetLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="h-1.5 w-full bg-border-custom/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    (totals.expenses / totals.budgetLimit) >= 0.9 ? 'bg-rose-500' : 
                    (totals.expenses / totals.budgetLimit) >= 0.75 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (totals.expenses / totals.budgetLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-center gap-2 shadow-amber-500/5">
            <span className="text-sm font-medium text-text-muted select-none">
              Remaining Budget
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-text-muted mb-1">
                  No budget set
                </h3>
                <a href="/budgets" className="text-xs text-primary hover:underline">Create a budget &rarr;</a>
              </div>
              <div className="p-2 rounded-xl border bg-amber-500/10 text-amber-500 border-amber-500/20">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Graphical Dashboards Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cash Flow Line/Area Chart */}
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm lg:col-span-2 flex flex-col h-[380px]">
          <h3 className="font-bold text-lg text-text-custom mb-4">Cash Flow Trend</h3>
          <div className="flex-1 w-full text-xs">
            {cashFlowTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted select-none">
                No cash flow trends available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cashFlowTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-800" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value) => `₹${value}`}
                    contentStyle={{
                      backgroundColor: 'var(--card-custom)',
                      borderColor: 'var(--border-custom)',
                      color: 'var(--text-custom)',
                      borderRadius: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses Category Pie Chart */}
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col h-[380px]">
          <h3 className="font-bold text-lg text-text-custom mb-4">Expense Distribution</h3>
          <div className="flex-1 w-full text-xs relative flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 select-none">
                <div className="w-12 h-12 bg-border-custom/50 border border-border-custom rounded-xl flex items-center justify-center text-text-muted mb-3">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm">No Monthly Expenses</h4>
                <p className="text-xs text-text-muted mt-1 max-w-xs">
                  Your expense category allocations will show here once you add monthly expense entries.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${value}`}
                    contentStyle={{
                      backgroundColor: 'var(--card-custom)',
                      borderColor: 'var(--border-custom)',
                      color: 'var(--text-custom)',
                      borderRadius: '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Lists Feed Row Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentTransactions />
        <BudgetAlerts />
      </div>
    </div>
  );
};

export default Dashboard;
