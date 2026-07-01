import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Utensils,
  Home,
  ShoppingBag,
  Car,
  Receipt,
  Heart,
  Play,
  TrendingUp,
  DollarSign,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { type Transaction, type TransactionFilters, type PaginationMetadata, transactionService } from '../services/transaction.service';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';

const categoryIcons: Record<string, React.ComponentType<any>> = {
  Food: Utensils,
  Rent: Home,
  Shopping: ShoppingBag,
  Transport: Car,
  Bills: Receipt,
  Healthcare: Heart,
  Entertainment: Play,
  Investment: TrendingUp,
  Salary: DollarSign,
  Others: HelpCircle
};

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filter parameters state
  const [searchVal, setSearchVal] = useState('');
  const [activeType, setActiveType] = useState<string>(''); // '' | 'income' | 'expense'
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);


  // Fetch transactions list
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: TransactionFilters = {
        page: currentPage,
        limit: 10
      };

      if (searchVal.trim()) filters.search = searchVal;
      if (activeType) filters.type = activeType;
      if (selectedCat) filters.category = selectedCat;

      const result = await transactionService.getTransactions(filters);
      setTransactions(result.transactions);
      setPagination(result.pagination);
    } catch (error: any) {
      toast.error('Failed to load transactions ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchVal, activeType, selectedCat]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Handle deletions
  const handleDelete = (id: string) => {
    setDeleteId(id);
  };


  // Open modal for editing
  const handleEditOpen = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  // Open modal for creation
  const handleAddOpen = () => {
    setSelectedTx(null);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterReset = () => {
    setSearchVal('');
    setActiveType('');
    setSelectedCat('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-text-muted">Review, filter, and manage your daily cashflow ledgers.</p>
        </div>
        <button
          onClick={handleAddOpen}
          className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-primary text-white text-sm font-semibold shadow-md hover:bg-opacity-95 transition-all cursor-pointer select-none self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Query Filters Column */}
      <div className="p-4 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Notes Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search notes / comments..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-custom bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Type Tabs */}
        <div className="flex border border-border-custom rounded-xl p-1 bg-background-custom w-full md:w-auto">
          {[
            { label: 'All', value: '' },
            { label: 'Income', value: 'income' },
            { label: 'Expense', value: 'expense' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveType(tab.value);
                setSelectedCat('');
                setCurrentPage(1);
              }}
              className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeType === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-custom'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Selector */}
        <div className="w-full md:w-48">
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-border-custom bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
          >
            <option value="">All Categories</option>
            {(activeType === 'income'
              ? ['Salary', 'Investment', 'Others']
              : activeType === 'expense'
              ? ['Food', 'Rent', 'Shopping', 'Transport', 'Bills', 'Healthcare', 'Entertainment', 'Others']
              : Object.keys(categoryIcons)
            ).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {(searchVal || activeType || selectedCat) && (
          <button
            onClick={handleFilterReset}
            className="text-xs font-semibold text-text-muted hover:text-rose-500 transition-colors cursor-pointer select-none md:ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Table Ledger Card */}
      <div className="rounded-2xl bg-card-custom border border-border-custom shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-xs text-text-muted">Loading ledgers...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-border-custom/50 border border-border-custom rounded-2xl flex items-center justify-center text-text-muted mb-4 select-none">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">No Transactions Found</h3>
            <p className="text-sm text-text-muted mt-1 max-w-sm">
              We couldn't find any transactions matching your filters. Try clearing constraints or adding a new record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-custom bg-background-custom/30 text-text-muted text-xs font-semibold uppercase tracking-wider select-none">
                  <th className="py-4 px-6">Details</th>
                  <th className="py-4 px-6 hidden sm:table-cell">Date</th>
                  <th className="py-4 px-6 hidden md:table-cell">Payment Method</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50">
                {transactions.map((tx) => {
                  const Icon = categoryIcons[tx.category] || HelpCircle;
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx._id} className="hover:bg-border-custom/10 transition-colors">
                      {/* Name Details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-text-custom block">{tx.category}</span>
                            <span className="text-xs text-text-muted mt-0.5 line-clamp-1 max-w-xs sm:max-w-md">
                              {tx.notes || 'No description'}
                            </span>
                          </div>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="py-4 px-6 text-text-muted hidden sm:table-cell">
                        {tx.date.split('T')[0]}
                      </td>
                      {/* Payment Method */}
                      <td className="py-4 px-6 text-text-muted hidden md:table-cell">
                        {tx.paymentMethod}
                      </td>
                      {/* Cash Amount */}
                      <td className={`py-4 px-6 text-right font-bold ${
                        isIncome ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {/* Controls */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditOpen(tx)}
                            className="p-1.5 rounded-lg border border-border-custom hover:bg-border-custom/30 text-text-muted hover:text-text-custom transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx._id)}
                            className="p-1.5 rounded-lg border border-border-custom hover:bg-rose-500/10 text-text-muted hover:text-rose-500 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Footer Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-border-custom/50 flex items-center justify-between bg-background-custom/10 text-xs font-semibold select-none">
                <span className="text-text-muted">
                  Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-border-custom hover:bg-border-custom/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-text-custom"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="p-2 rounded-lg border border-border-custom hover:bg-border-custom/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-text-custom"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CRUD Modal overlay container */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchList}
        editTransaction={selectedTx}
      />

      {/* Custom Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDeleteId(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm p-6 rounded-2xl glass-panel shadow-2xl z-10 bg-card-custom text-text-custom border border-border-custom text-center">
            <h3 className="text-lg font-bold mb-2">Delete Transaction</h3>
            <p className="text-sm text-text-muted mb-6">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border-custom hover:bg-border-custom/30 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await transactionService.deleteTransaction(deleteId);
                    toast.success('Transaction deleted.');
                    setDeleteId(null);
                    fetchList();
                  } catch (error) {
                    toast.error('Failed to delete transaction.');
                  }
                }}
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


export default Transactions;
