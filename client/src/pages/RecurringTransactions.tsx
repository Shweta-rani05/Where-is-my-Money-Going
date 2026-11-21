import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Loader2,
  X,
  CheckCircle,
} from 'lucide-react';
import {
  recurringService,
  type RecurringTransaction,
  type CreateRecurringDTO,
} from '../services/recurring.service';
import toast from 'react-hot-toast';

export const RecurringTransactions: React.FC = () => {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income' | 'paused'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessingDue, setIsProcessingDue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<RecurringTransaction['category']>('Bills');
  const [paymentMethod, setPaymentMethod] = useState<RecurringTransaction['paymentMethod']>('UPI');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [nextDueDate, setNextDueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [autoProcess, setAutoProcess] = useState(true);
  const [notes, setNotes] = useState('');

  const fetchRecurring = async () => {
    try {
      setIsLoading(true);
      const data = await recurringService.getRecurring();
      setItems(data);
    } catch (error: any) {
      toast.error('Failed to load recurring transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) {
      toast.error('Title and amount are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateRecurringDTO = {
        title,
        amount: Number(amount),
        type,
        category,
        paymentMethod,
        frequency,
        nextDueDate,
        startDate: nextDueDate,
        autoProcess,
        notes,
      };

      await recurringService.createRecurring(payload);
      toast.success(`Recurring ${type} "${title}" added!`);
      setIsModalOpen(false);
      resetForm();
      fetchRecurring();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create recurring transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setType('expense');
    setCategory('Bills');
    setPaymentMethod('UPI');
    setFrequency('monthly');
    setNextDueDate(new Date().toISOString().split('T')[0]);
    setAutoProcess(true);
    setNotes('');
  };

  const handleToggleStatus = async (item: RecurringTransaction) => {
    const nextStatus = item.status === 'active' ? 'paused' : 'active';
    try {
      await recurringService.updateStatus(item._id, nextStatus);
      toast.success(`Rule "${item.title}" is now ${nextStatus}.`);
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, status: nextStatus } : i))
      );
    } catch (error: any) {
      toast.error('Failed to change status.');
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Delete recurring rule "${itemTitle}"?`)) return;
    try {
      await recurringService.deleteRecurring(id);
      toast.success(`Removed "${itemTitle}".`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (error: any) {
      toast.error('Failed to delete rule.');
    }
  };

  const handleProcessItem = async (ruleId: string, ruleTitle: string) => {
    try {
      const res = await recurringService.processDue(ruleId);
      if (res.processedCount > 0) {
        toast.success(`Recorded "${ruleTitle}" into transactions!`);
      } else {
        toast(`"${ruleTitle}" is not yet due.`);
      }
      fetchRecurring();
    } catch (error: any) {
      toast.error('Failed to process item.');
    }
  };

  const handleProcessAllDue = async () => {
    try {
      setIsProcessingDue(true);
      const res = await recurringService.processDue();
      if (res.processedCount > 0) {
        toast.success(`Processed ${res.processedCount} due recurring transactions!`);
      } else {
        toast.success('All scheduled transactions are up to date!');
      }
      fetchRecurring();
    } catch (error: any) {
      toast.error('Failed to process due transactions.');
    } finally {
      setIsProcessingDue(false);
    }
  };

  // Metric Calculations (Normalized to monthly values)
  const normalizeToMonthly = (amount: number, freq: string) => {
    switch (freq) {
      case 'daily':
        return amount * 30;
      case 'weekly':
        return amount * 4.33;
      case 'monthly':
        return amount;
      case 'yearly':
        return amount / 12;
      default:
        return amount;
    }
  };

  const activeItems = items.filter((i) => i.status === 'active');
  const monthlyExpenses = activeItems
    .filter((i) => i.type === 'expense')
    .reduce((sum, i) => sum + normalizeToMonthly(i.amount, i.frequency), 0);

  const monthlyIncome = activeItems
    .filter((i) => i.type === 'income')
    .reduce((sum, i) => sum + normalizeToMonthly(i.amount, i.frequency), 0);

  const dueItemsCount = activeItems.filter(
    (i) => new Date(i.nextDueDate) <= new Date()
  ).length;

  // Filter list
  const filteredItems = items.filter((item) => {
    if (filter === 'paused') return item.status === 'paused';
    if (filter === 'expense') return item.type === 'expense';
    if (filter === 'income') return item.type === 'income';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-text-muted font-medium tracking-wide">
          Loading recurring commitments...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Transactions</h1>
          <p className="text-text-muted">
            Automate monthly subscriptions, fixed utility bills, and scheduled recurring income.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {dueItemsCount > 0 && (
            <button
              onClick={handleProcessAllDue}
              disabled={isProcessingDue}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Process {dueItemsCount} Due Items</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Est. Monthly Expenses
            </span>
            <div className="text-2xl font-bold mt-1 text-rose-500">
              ₹{Math.round(monthlyExpenses).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-text-muted mt-1">From active bills & subscriptions</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Est. Monthly Income
            </span>
            <div className="text-2xl font-bold mt-1 text-emerald-500">
              ₹{Math.round(monthlyIncome).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-text-muted mt-1">Salary & predictable earnings</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Active Schedules
            </span>
            <div className="text-2xl font-bold mt-1 text-text-custom">
              {activeItems.length} Active
            </div>
            <p className="text-xs text-text-muted mt-1">
              {dueItemsCount > 0 ? (
                <span className="text-amber-500 font-semibold">{dueItemsCount} due for record</span>
              ) : (
                'All schedules up to date'
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Repeat className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border-custom pb-2">
        {(['all', 'expense', 'income', 'paused'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              filter === tab
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-custom hover:bg-card-custom'
            }`}
          >
            {tab === 'all'
              ? `All (${items.length})`
              : tab === 'expense'
              ? 'Expenses & Bills'
              : tab === 'income'
              ? 'Income Schedules'
              : 'Paused'}
          </button>
        ))}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="border border-border-custom border-dashed rounded-3xl bg-card-custom/50 p-12 text-center flex flex-col items-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-text-custom mb-1">No recurring items found</h3>
          <p className="text-xs text-text-muted mb-5 leading-relaxed">
            Schedule recurring subscriptions (like Netflix, Spotify), utility bills (Wi-Fi, Rent), or salary to automatically track them.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all"
          >
            + Add First Recurring Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const dueDate = new Date(item.nextDueDate);
            const isDueNow = dueDate <= new Date() && item.status === 'active';
            const isIncome = item.type === 'income';

            return (
              <div
                key={item._id}
                className={`relative rounded-3xl border bg-card-custom p-5 shadow-sm flex flex-col justify-between transition-all ${
                  item.status === 'paused'
                    ? 'border-border-custom/50 opacity-70'
                    : isDueNow
                    ? 'border-amber-500/50 ring-1 ring-amber-500/30'
                    : 'border-border-custom hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Row: Category + Frequency */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-background-custom border border-border-custom text-text-muted">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {item.frequency}
                    </span>
                  </div>

                  {/* Title & Amount */}
                  <h4 className="font-bold text-text-custom text-base mb-1 truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span
                      className={`text-2xl font-bold ${
                        isIncome ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {isIncome ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-text-muted capitalize">/{item.frequency}</span>
                  </div>

                  {/* Schedule Details */}
                  <div className="p-3 rounded-2xl bg-background-custom/60 border border-border-custom/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Next Due:</span>
                      <span
                        className={`font-semibold ${
                          isDueNow ? 'text-amber-500 flex items-center gap-1' : 'text-text-custom'
                        }`}
                      >
                        {isDueNow && <AlertCircle className="w-3.5 h-3.5" />}
                        {dueDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Payment Method:</span>
                      <span className="font-medium text-text-custom">{item.paymentMethod}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Status:</span>
                      <span
                        className={`capitalize font-semibold ${
                          item.status === 'active' ? 'text-emerald-500' : 'text-text-muted'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border-custom/50">
                  <button
                    onClick={() => handleProcessItem(item._id, item.title)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-border-custom hover:bg-border-custom/40 text-xs font-semibold text-text-custom transition-all flex items-center justify-center gap-1"
                    title="Record transaction now"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Record Now
                  </button>

                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="p-2 rounded-xl border border-border-custom hover:bg-border-custom/40 text-text-muted hover:text-text-custom transition-all"
                    title={item.status === 'active' ? 'Pause Rule' : 'Resume Rule'}
                  >
                    {item.status === 'active' ? (
                      <Pause className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(item._id, item.title)}
                    className="p-2 rounded-xl text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Recurring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 md:p-8 rounded-3xl bg-card-custom shadow-2xl border border-border-custom text-text-custom animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-text-muted hover:text-text-custom hover:bg-border-custom/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Add Recurring Rule</h3>
                <p className="text-xs text-text-muted">
                  Schedule automatic transactions for predictable expenses and income
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Type Toggle: Expense vs Income */}
              <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-background-custom border border-border-custom">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-text-muted hover:text-text-custom'
                  }`}
                >
                  Expense / Bill
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    type === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-text-muted hover:text-text-custom'
                  }`}
                >
                  Income / Salary
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                  Title / Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Netflix Subscription, Apartment Rent, Monthly Salary"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Amount & Frequency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2500"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {/* Category & Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Bills">Bills</option>
                    <option value="Rent">Rent</option>
                    <option value="Food">Food</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Transport">Transport</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Investment">Investment</option>
                    <option value="Salary">Salary</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              {/* Next Due Date */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Plan renewed on 15th every month"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-custom hover:bg-border-custom/40 text-text-custom text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Save Schedule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringTransactions;
