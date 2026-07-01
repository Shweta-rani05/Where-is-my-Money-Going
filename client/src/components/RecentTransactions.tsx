import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Utensils, Home, Car, Heart, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  notes: string;
  date: string;
  paymentMethod: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', amount: '₹12,400.00', type: 'expense', category: 'Rent', notes: 'Monthly rent payment', date: '2026-06-30', paymentMethod: 'Bank Transfer' },
  { id: '2', amount: '₹45,000.00', type: 'income', category: 'Salary', notes: 'Monthly payroll', date: '2026-06-28', paymentMethod: 'Direct Deposit' },
  { id: '3', amount: '₹1,250.00', type: 'expense', category: 'Food', notes: 'Grocery shopping', date: '2026-06-27', paymentMethod: 'Credit Card' },
  { id: '4', amount: '₹3,400.00', type: 'expense', category: 'Shopping', notes: 'Bought new sneakers', date: '2026-06-25', paymentMethod: 'UPI' },
  { id: '5', amount: '₹500.00', type: 'expense', category: 'Transport', notes: 'Cab fare to office', date: '2026-06-24', paymentMethod: 'Cash' }
];

const categoryIcons: Record<string, React.ComponentType<any>> = {
  Food: Utensils,
  Rent: Home,
  Shopping: ShoppingBag,
  Transport: Car,
  Healthcare: Heart,
  Salary: DollarSign
};

export const RecentTransactions: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg text-text-custom">Recent Transactions</h3>
        <Link
          to="/transactions"
          className="text-xs font-semibold text-primary hover:underline transition-all"
        >
          View All
        </Link>
      </div>

      <div className="flex-1 space-y-4">
        {mockTransactions.map((tx) => {
          const IconComponent = categoryIcons[tx.category] || DollarSign;
          const isIncome = tx.type === 'income';

          return (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-border-custom/50 hover:bg-border-custom/10 transition-colors">
              <div className="flex items-center gap-3">
                {/* Visual indicator icon */}
                <div className={`p-2.5 rounded-lg border ${
                  isIncome
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-custom">{tx.category}</h4>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{tx.notes}</p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-sm font-bold flex items-center justify-end gap-1 ${
                  isIncome ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {isIncome ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  {tx.amount}
                </span>
                <span className="text-[10px] text-text-muted mt-0.5 block">{tx.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentTransactions;
