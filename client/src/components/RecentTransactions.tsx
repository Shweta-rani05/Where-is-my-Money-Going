import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Utensils, Home, Car, Heart, DollarSign } from 'lucide-react';
import { transactionService, type Transaction } from '../services/transaction.service';
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
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-text-muted select-none">
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted select-none p-6">
            <DollarSign className="w-10 h-10 mb-2 opacity-20" />
            <p>No transactions yet.</p>
            <Link to="/transactions" className="text-xs text-primary hover:underline mt-1">Add your first transaction</Link>
          </div>
        ) : (
          transactions.map((tx) => {
            const IconComponent = categoryIcons[tx.category] || DollarSign;
            const isIncome = tx.type === 'income';
            
            const formattedDate = new Date(tx.date).toLocaleDateString();
            const formattedAmount = `₹${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

            return (
              <div key={tx._id} className="flex items-center justify-between p-3 rounded-xl border border-border-custom/50 hover:bg-border-custom/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border ${
                    isIncome
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-custom">{tx.category}</h4>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{tx.notes || tx.type}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-bold flex items-center justify-end gap-1 ${
                    isIncome ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {isIncome ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {formattedAmount}
                  </span>
                  <span className="text-[10px] text-text-muted mt-0.5 block">{formattedDate}</span>
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
