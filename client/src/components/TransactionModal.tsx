import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { type Transaction, transactionService } from '../services/transaction.service';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTransaction?: Transaction | null;
}

// Zod validation schema matching backend constraints
const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number greater than 0'
    }),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional(),
  date: z.string().min(1, 'Date is required')
});

type TransactionFormFields = z.infer<typeof transactionSchema>;

const incomeCategories = ['Salary', 'Investment', 'Others'];
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

const paymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'UPI', 'Others'];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editTransaction
}) => {
  const isEditMode = !!editTransaction;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TransactionFormFields>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      type: 'expense',
      category: '',
      paymentMethod: 'UPI',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  // Watch the type input to dynamically filter category selections
  const selectedType = useWatch({
    control,
    name: 'type'
  });

  // Reset/prefill forms whenever edit target changes
  useEffect(() => {
    if (editTransaction) {
      reset({
        amount: editTransaction.amount.toString(),
        type: editTransaction.type,
        category: editTransaction.category,
        paymentMethod: editTransaction.paymentMethod,
        notes: editTransaction.notes || '',
        date: editTransaction.date.split('T')[0]
      });
    } else {
      reset({
        amount: '',
        type: 'expense',
        category: '',
        paymentMethod: 'UPI',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [editTransaction, reset, isOpen]);

  // Adjust active category if the type switcher switches
  useEffect(() => {
    if (!isEditMode) {
      setValue('category', '');
    }
  }, [selectedType, setValue, isEditMode]);

  if (!isOpen) return null;

  const onSubmit = async (data: TransactionFormFields) => {
    try {
      const payload = {
        amount: parseFloat(data.amount),
        type: data.type,
        category: data.category as any,
        paymentMethod: data.paymentMethod as any,
        notes: data.notes,
        date: new Date(data.date).toISOString()
      };

      if (isEditMode && editTransaction) {
        await transactionService.updateTransaction(editTransaction._id, payload);
        toast.success('Transaction updated successfully.');
      } else {
        await transactionService.createTransaction(payload);
        toast.success('Transaction added successfully.');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to save transaction. Please try again.';
      toast.error(errMsg);
    }
  };

  const categories = selectedType === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal Container */}
      <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel shadow-2xl z-10 transition-colors duration-300 bg-card-custom text-text-custom border border-border-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">
            {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-border-custom/50 text-text-muted hover:text-text-custom transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                selectedType === 'expense'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : 'border-border-custom hover:bg-border-custom/30 text-text-muted'
              }`}>
                <input
                  type="radio"
                  value="expense"
                  {...register('type')}
                  className="sr-only"
                />
                Expense
              </label>
              <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                selectedType === 'income'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'border-border-custom hover:bg-border-custom/30 text-text-muted'
              }`}>
                <input
                  type="radio"
                  value="income"
                  {...register('type')}
                  className="sr-only"
                />
                Income
              </label>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Amount (₹)
            </label>
            <input
              type="text"
              {...register('amount')}
              placeholder="0.00"
              className={`w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.amount
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-border-custom focus:ring-primary/20 focus:border-primary'
              }`}
            />
            {errors.amount && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.amount.message}</span>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Category
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
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.category.message}</span>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Payment Method
            </label>
            <select
              {...register('paymentMethod')}
              className="w-full px-4 py-3 rounded-xl border border-border-custom bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Transaction Date
            </label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-4 py-3 rounded-xl border border-border-custom bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Notes / Description
            </label>
            <input
              type="text"
              {...register('notes')}
              placeholder="e.g. Weekly veggies shopping"
              className={`w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.notes
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-border-custom focus:ring-primary/20 focus:border-primary'
              }`}
            />
            {errors.notes && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.notes.message}</span>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-border-custom hover:bg-border-custom/30 text-sm font-semibold text-text-custom transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-opacity-95 text-white text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
