import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Utensils, Home, Car, Heart, DollarSign } from 'lucide-react';
import { transactionService, type Transaction } from '../services/transaction.service';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';

const categoryIcons: Record<string, React.ComponentType<any>> = {
  Food: Utensils,
  Rent: Home,
  Shopping: ShoppingBag,
  Transport: Car,
  Healthcare: Heart,
  Salary: DollarSign
};

export const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { formatAmount } = useCurrency();

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const payload = await transactionService.getTransactions({ limit: 5 });
        setTransactions(payload.transactions);
      } catch (error) {
        toast.error('Failed to load recent transactions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-base text-text-custom">Recent Transactions</h3>
          <p className="text-xs text-text-muted mt-0.5">Your latest account movements</p>
        </div>
        <Link
          to="/transactions"
          className="text-xs font-semibold text-primary hover:underline transition-all"
        >
          View all
        </Link>
      </div>

      <div className="flex-1 space-y-3">
        {isLoading ? (
          <div className="h-full min-h-[160px] flex items-center justify-center text-text-muted text-xs select-none">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-text-muted select-none p-6 text-center">
            <DollarSign className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No transactions recorded yet.</p>
            <Link to="/transactions" className="text-xs text-primary hover:underline mt-1">Add your first transaction</Link>
          </div>
        ) : (
          transactions.map((tx) => {
            const IconComponent = categoryIcons[tx.category] || DollarSign;
            const isIncome = tx.type === 'income';
            const formattedDate = new Date(tx.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={tx._id}
                className="flex items-center justify-between p-3 rounded-xl border border-border-custom/60 bg-card-custom/50 hover:bg-border-custom/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg border flex-shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-medium text-text-custom truncate">{tx.category}</h4>
                    <p className="text-xs text-text-muted truncate mt-0.5">{tx.notes || (isIncome ? 'Deposit' : 'Expense')}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <span
                    className={`text-sm font-semibold tabular-nums font-numeric flex items-center justify-end gap-1 ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    {formatAmount(tx.amount)}
                  </span>
                  <span className="text-[11px] text-text-muted mt-0.5 block">{formattedDate}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
