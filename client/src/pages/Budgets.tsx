import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Trash2, Plus, Wallet, Percent } from 'lucide-react';

import { type Budget, budgetService } from '../services/budget.service';
import toast from 'react-hot-toast';

const budgetFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z
    .string()
    .min(1, 'Budget limit is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Limit must be a positive number greater than 0'
    })
});

type BudgetFormFields = z.infer<typeof budgetFormSchema>;

const expenseCategories = [
  'Food',
  'Rent',
  'Shopping',
  'Transport',
  'Bills',
  'Healthcare',
  'Entertainment',
  'Others'
];

export const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BudgetFormFields>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: '',
      limit: ''
    }
  });

  const fetchBudgets = useCallback(async () => {
    try {
      const data = await budgetService.getBudgets();
      setBudgets(data);
    } catch (error) {
      toast.error('Failed to load category budgets.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const onSubmit = async (data: BudgetFormFields) => {
    try {
      await budgetService.updateBudget({
        category: data.category,
        limit: parseFloat(data.limit)
      });
      toast.success('Budget limit set successfully.');
      reset({ category: '', limit: '' });
      fetchBudgets();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to save budget settings.';
      toast.error(errMsg);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await budgetService.deleteBudget(deleteId);
      toast.success('Budget limit removed.');
      setDeleteId(null);
      fetchBudgets();
    } catch (error) {
      toast.error('Failed to remove budget limit.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
        <p className="text-text-muted">Set spending limit thresholds and track monthly category usage.</p>
      </div>

      {/* Grid Layout Container */}
      <div className="grid gap-6 md:grid-cols-3 items-start">
        
        {/* Left Column: Form Settings */}
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-text-custom">Set Category Budget</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Expense Category
              </label>
              <select
                {...register('category')}
                className={`w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all appearance-none ${
                  errors.category
                    ? 'border-rose-500 focus:ring-rose-500/20'
                    : 'border-border-custom focus:ring-primary/20 focus:border-primary'
                }`}
              >
                <option value="" disabled>Select category</option>
                {expenseCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.category.message}</span>
              )}
            </div>

            {/* Limit Input */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Monthly Limit (₹)
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register('limit')}
                  placeholder="0.00"
                  className={`w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.limit
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-border-custom focus:ring-primary/20 focus:border-primary'
                  }`}
                />
              </div>
              {errors.limit && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.limit.message}</span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-opacity-95 text-white text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 select-none"
            >
              <Plus className="w-4 h-4" />
              Set Budget
            </button>
          </form>
        </div>

        {/* Right Column: Progress List Grid */}
        <div className="md:col-span-2 space-y-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 rounded-2xl bg-card-custom border border-border-custom">
              <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-xs text-text-muted">Loading budgets data...</span>
            </div>
          ) : budgets.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center rounded-2xl bg-card-custom border border-border-custom">
              <div className="w-16 h-16 bg-border-custom/50 border border-border-custom rounded-2xl flex items-center justify-center text-text-muted mb-4 select-none">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">No Budgets Set</h3>
              <p className="text-sm text-text-muted mt-1 max-w-sm">
                You haven't defined any spending budgets yet. Configure limits on the left to start tracking thresholds.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {budgets.map((b) => {
                const percentage = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                const isWarning = percentage >= 85;

                return (
                  <div
                    key={b._id}
                    className={`p-5 rounded-2xl bg-card-custom border shadow-sm transition-all duration-300 flex flex-col justify-between ${
                      isWarning ? 'border-rose-500/50 shadow-rose-500/5' : 'border-border-custom'
                    }`}
                  >
                    <div>
                      {/* Card Header details */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-base text-text-custom">{b.category}</h4>
                          <span className="text-xs text-text-muted">Active Budget</span>
                        </div>
                        <button
                          onClick={() => setDeleteId(b._id)}
                          className="p-1.5 rounded-lg border border-border-custom hover:bg-rose-500/10 text-text-muted hover:text-rose-500 transition-all cursor-pointer"
                          title="Remove budget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Spent status */}
                      <div className="flex justify-between items-baseline text-xs font-semibold mb-2">
                        <span className="text-text-muted">Spent: ₹{b.spent.toLocaleString()}</span>
                        <span className={isWarning ? 'text-rose-500 font-bold' : 'text-text-custom'}>
                          Limit: ₹{b.limit.toLocaleString()}
                        </span>
                      </div>

                      {/* Custom Visual progress bar */}
                      <div className="h-2.5 w-full rounded-full bg-border-custom/50 overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isWarning ? 'bg-rose-500 animate-pulse' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Alert Message */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-custom/30 text-xs select-none">
                      <span className="text-text-muted font-medium flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-text-muted" />
                        {Math.floor(percentage)}% Used
                      </span>
                      {isWarning && (
                        <span className="text-rose-500 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 animate-bounce" />
                          Threshold Alert
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDeleteId(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm p-6 rounded-2xl glass-panel shadow-2xl z-10 bg-card-custom text-text-custom border border-border-custom text-center">
            <h3 className="text-lg font-bold mb-2">Remove Budget</h3>
            <p className="text-sm text-text-muted mb-6">
              Are you sure you want to remove this category budget? You will no longer receive limit warnings for it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border-custom hover:bg-border-custom/30 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-opacity-95 text-white text-sm font-semibold shadow-md transition-all cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
