import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Mail,
  PlusCircle,
  Landmark,
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import RecentTransactions from '../components/RecentTransactions';
import BudgetAlerts from '../components/BudgetAlerts';
import EmailReportModal from '../components/EmailReportModal';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { transactionService, type TransactionSummary } from '../services/transaction.service';
import { creditScoreService, type CreditScoreData } from '../services/creditScore.service';
import { investmentService, type PortfolioSummary } from '../services/investment.service';
import toast from 'react-hot-toast';

const PALETTE = [
  '#0d9488', // Teal primary
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#10b981', // Emerald
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();

  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [creditData, setCreditData] = useState<CreditScoreData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, creditRes, portRes] = await Promise.allSettled([
          transactionService.getTransactionSummary(),
          creditScoreService.getCreditScore(),
          investmentService.getPortfolio()
        ]);

        if (sumRes.status === 'fulfilled') {
          setSummary(sumRes.value);
        } else {
          toast.error('Failed to load transaction summary.');
        }

        if (creditRes.status === 'fulfilled') {
          setCreditData(creditRes.value);
        }
        if (portRes.status === 'fulfilled') {
          setPortfolio(portRes.value.summary);
        }
      } catch (error) {
        toast.error('Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-text-muted font-medium">
          Loading financial command center...
        </span>
      </div>
    );
  }

  const totals = summary?.totals || {
    income: 0,
    expenses: 0,
    savings: 0,
    remainingBudget: 0,
    hasBudget: false,
    budgetLimit: 0
  };

  const netSavings = totals.savings;
  const savingsRate = totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0;

  const categoryData = summary
    ? summary.categoryDistribution.map((item, index) => ({
        name: item.name,
        value: item.value,
        color: PALETTE[index % PALETTE.length]
      }))
    : [];

  const cashFlowTrend = summary?.cashFlowTrend || [];

  return (
    <div className="space-y-6">
      
      {/* 1. FINANCIAL COMMAND CENTER HERO */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Net Position Statement */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-muted">Net Cashflow (This Month)</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  savingsRate >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {savingsRate >= 0 ? `+${savingsRate}% saved` : `${savingsRate}% net deficit`}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-numeric tabular-nums text-text-custom">
              {formatAmount(netSavings)}
            </h1>

            <p className="text-xs text-text-muted">
              Monthly overview for <span className="font-medium text-text-custom">{user?.name || 'Account Owner'}</span>. Live converted rates applied.
            </p>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/transactions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Transaction</span>
            </Link>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border-custom bg-card-custom hover:bg-border-custom/40 text-text-custom text-xs font-semibold transition-all cursor-pointer active:scale-95"
            >
              <Mail className="w-4 h-4 text-primary" />
              <span>Email Report</span>
            </button>

            <Link
              to="/banks"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border-custom bg-card-custom hover:bg-border-custom/40 text-text-custom text-xs font-semibold transition-all active:scale-95"
            >
              <Landmark className="w-4 h-4 text-text-muted" />
              <span>Bank Feeds</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CORE METRICS STRIP */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Inflow Card */}
        <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Total Inflow</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-numeric tabular-nums text-text-custom">
              {formatAmount(totals.income)}
            </div>
            <p className="text-[11px] text-text-muted">Earned & credited this month</p>
          </div>
        </div>

        {/* Outflow Card */}
        <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Total Outflow</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-numeric tabular-nums text-text-custom">
              {formatAmount(totals.expenses)}
            </div>
            <p className="text-[11px] text-text-muted">Debited & spent this month</p>
          </div>
        </div>

        {/* Budget Cushion */}
        <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Budget Cushion</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          {totals.hasBudget ? (
            <div className="space-y-1.5">
              <div className="text-2xl font-bold font-numeric tabular-nums text-text-custom">
                {formatAmount(totals.remainingBudget)}
              </div>
              <div className="h-1.5 w-full bg-border-custom/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totals.budgetLimit > 0 && totals.expenses / totals.budgetLimit >= 0.85
                      ? 'bg-rose-500'
                      : 'bg-primary'
                  }`}
                  style={{
                    width: `${Math.min(100, totals.budgetLimit > 0 ? (totals.expenses / totals.budgetLimit) * 100 : 0)}%`
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-muted">No global budget</p>
              <Link to="/budgets" className="text-xs text-primary hover:underline block">
                Create spending limit &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Financial Health Signal (Credit / Portfolio) */}
        <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Credit Health</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          {creditData ? (
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-numeric tabular-nums text-text-custom">
                  {creditData.score}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {creditData.tier}
                </span>
              </div>
              <Link to="/credit-score" className="text-[11px] text-text-muted hover:text-primary transition-colors flex items-center gap-0.5">
                <span>View score factors</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : portfolio ? (
            <div className="space-y-0.5">
              <div className="text-2xl font-bold font-numeric tabular-nums text-text-custom">
                {formatAmount(portfolio.totalCurrentValue)}
              </div>
              <Link to="/investments" className="text-[11px] text-text-muted hover:text-primary transition-colors flex items-center gap-0.5">
                <span>Investments portfolio</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-muted">742 Good</p>
              <Link to="/credit-score" className="text-xs text-primary hover:underline block">
                Explore credit health &rarr;
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* 3. CHARTS ROW */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Cash Flow Trajectory */}
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-xs lg:col-span-2 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base text-text-custom">Cash Flow Trend</h3>
              <p className="text-xs text-text-muted mt-0.5">Inflow vs outflow across recent periods</p>
            </div>
          </div>

          <div className="flex-1 w-full text-xs">
            {cashFlowTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted select-none">
                No cash flow trends recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cashFlowTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-800" />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => formatAmount(Number(value) || 0)}
                    contentStyle={{
                      backgroundColor: 'var(--card-custom)',
                      borderColor: 'var(--border-custom)',
                      color: 'var(--text-custom)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incomeFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Allocations */}
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-xs flex flex-col h-[380px]">
          <div className="mb-4">
            <h3 className="font-semibold text-base text-text-custom">Expense Distribution</h3>
            <p className="text-xs text-text-muted mt-0.5">Allocation by spending category</p>
          </div>

          <div className="flex-1 w-full text-xs relative flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 select-none">
                <AlertCircle className="w-8 h-8 text-text-muted mb-2 opacity-30" />
                <h4 className="font-medium text-sm text-text-custom">No expense distribution</h4>
                <p className="text-xs text-text-muted mt-1 max-w-xs">
                  Category allocations will appear here once you record expenses.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatAmount(Number(value) || 0)}
                    contentStyle={{
                      backgroundColor: 'var(--card-custom)',
                      borderColor: 'var(--border-custom)',
                      color: 'var(--text-custom)',
                      borderRadius: '12px'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    formatter={(value: string) => <span className="text-text-custom">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 4. ACTIVITY & BUDGETS GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentTransactions />
        <BudgetAlerts />
      </div>

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

    </div>
  );
};

export default Dashboard;