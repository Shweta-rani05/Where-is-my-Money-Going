import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Target, Trash2, Plus, PiggyBank, PartyPopper, ArrowUpCircle } from 'lucide-react';
import { type Goal, goalService } from '../services/goal.service';
import toast from 'react-hot-toast';

const goalFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  targetAmount: z
    .string()
    .min(1, 'Target amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Target must be a positive number'
    })
});

type GoalFormFields = z.infer<typeof goalFormSchema>;

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<GoalFormFields>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: { title: '', targetAmount: '' }
  });

  const fetchGoals = useCallback(async () => {
    try {
      const data = await goalService.getGoals();
      setGoals(data);
    } catch (error) {
      toast.error('Failed to load savings goals.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const onSubmit = async (data: GoalFormFields) => {
    try {
      await goalService.createGoal({
        title: data.title,
        targetAmount: parseFloat(data.targetAmount)
      });
      toast.success('Savings goal created!');
      reset({ title: '', targetAmount: '' });
      fetchGoals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create goal.');
    }
  };

  const handleDeposit = async (goal: Goal) => {
    const amountStr = depositAmounts[goal._id];
    const amount = parseFloat(amountStr || '0');
    if (!amount || amount <= 0) {
      toast.error('Enter a valid deposit amount.');
      return;
    }

    const newSaved = Math.min(goal.savedAmount + amount, goal.targetAmount);
    try {
      await goalService.updateGoal(goal._id, { savedAmount: newSaved });
      toast.success(`₹${amount.toLocaleString()} deposited!`);
      setDepositAmounts((prev) => ({ ...prev, [goal._id]: '' }));
      fetchGoals();
    } catch (error) {
      toast.error('Failed to update savings.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await goalService.deleteGoal(deleteId);
      toast.success('Goal removed.');
      setDeleteId(null);
      fetchGoals();
    } catch (error) {
      toast.error('Failed to delete goal.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
        <p className="text-text-muted">Define financial targets and track your progress towards them.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Left: Create Form */}
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-text-custom flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            New Goal
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Goal Title
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Emergency Fund"
                className={`w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.title
                    ? 'border-rose-500 focus:ring-rose-500/20'
                    : 'border-border-custom focus:ring-primary/20 focus:border-primary'
                }`}
              />
              {errors.title && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.title.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Target Amount (₹)
              </label>
              <input
                type="text"
                {...register('targetAmount')}
                placeholder="50000"
                className={`w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.targetAmount
                    ? 'border-rose-500 focus:ring-rose-500/20'
                    : 'border-border-custom focus:ring-primary/20 focus:border-primary'
                }`}
              />
              {errors.targetAmount && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.targetAmount.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-opacity-95 text-white text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 select-none"
            >
              <Plus className="w-4 h-4" />
              Create Goal
            </button>
          </form>
        </div>

        {/* Right: Goals Grid */}
        <div className="md:col-span-2 space-y-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 rounded-2xl bg-card-custom border border-border-custom">
              <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-xs text-text-muted">Loading savings goals...</span>
            </div>
          ) : goals.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center rounded-2xl bg-card-custom border border-border-custom">
              <div className="w-16 h-16 bg-border-custom/50 border border-border-custom rounded-2xl flex items-center justify-center text-text-muted mb-4 select-none">
                <PiggyBank className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">No Goals Yet</h3>
              <p className="text-sm text-text-muted mt-1 max-w-sm">
                Create your first savings goal on the left to start tracking your financial targets.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map((g) => {
                const percentage = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
                const isComplete = percentage >= 100;

                return (
                  <div
                    key={g._id}
                    className={`p-5 rounded-2xl bg-card-custom border shadow-sm transition-all duration-300 ${
                      isComplete ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-border-custom'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-base text-text-custom flex items-center gap-2">
                          {g.title}
                          {isComplete && <PartyPopper className="w-4 h-4 text-emerald-500" />}
                        </h4>
                        <span className="text-xs text-text-muted">
                          {isComplete ? '🎉 Goal achieved!' : 'In progress'}
                        </span>
                      </div>
                      <button
                        onClick={() => setDeleteId(g._id)}
                        className="p-1.5 rounded-lg border border-border-custom hover:bg-rose-500/10 text-text-muted hover:text-rose-500 transition-all cursor-pointer"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Amount Display */}
                    <div className="flex justify-between items-baseline text-xs font-semibold mb-2">
                      <span className="text-emerald-500">₹{g.savedAmount.toLocaleString()}</span>
                      <span className="text-text-muted">/ ₹{g.targetAmount.toLocaleString()}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2.5 w-full rounded-full bg-border-custom/50 overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="text-xs font-medium text-text-muted mb-3">
                      {Math.floor(percentage)}% Complete
                    </div>

                    {/* Deposit Input */}
                    {!isComplete && (
                      <div className="flex gap-2 pt-2 border-t border-border-custom/30">
                        <input
                          type="text"
                          placeholder="₹ Amount"
                          value={depositAmounts[g._id] || ''}
                          onChange={(e) =>
                            setDepositAmounts((prev) => ({
                              ...prev,
                              [g._id]: e.target.value
                            }))
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-border-custom bg-background-custom text-text-custom text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                        <button
                          onClick={() => handleDeposit(g)}
                          className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          Deposit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDeleteId(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm p-6 rounded-2xl glass-panel shadow-2xl z-10 bg-card-custom text-text-custom border border-border-custom text-center">
            <h3 className="text-lg font-bold mb-2">Delete Goal</h3>
            <p className="text-sm text-text-muted mb-6">
              Are you sure? All saved progress will be lost permanently.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
