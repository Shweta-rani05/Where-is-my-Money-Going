import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Trash2,
  PieChart as PieIcon,
  Loader2,
  X,
  Briefcase,
  Edit2,
  Check,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  investmentService,
  type PortfolioData,
  type CreateInvestmentDTO,
  type AssetClass,
} from '../services/investment.service';
import toast from 'react-hot-toast';

const ASSET_COLORS: Record<string, string> = {
  stocks: '#3B82F6', // Blue
  mutual_funds: '#10B981', // Emerald
  crypto: '#F59E0B', // Amber
  gold: '#EAB308', // Gold
  fixed_deposit: '#8B5CF6', // Purple
  real_estate: '#6366F1', // Indigo
  other: '#64748B', // Slate
};

const ASSET_LABELS: Record<string, string> = {
  stocks: 'Stocks & Equities',
  mutual_funds: 'Mutual Funds',
  crypto: 'Crypto Assets',
  gold: 'Gold & Metals',
  fixed_deposit: 'Fixed Deposits',
  real_estate: 'Real Estate',
  other: 'Other Assets',
};

export const Investments: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Quick edit inline price
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  // Form State
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('stocks');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [recordAsExpense, setRecordAsExpense] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      const data = await investmentService.getPortfolio();
      setPortfolio(data);
    } catch (error: any) {
      toast.error('Failed to load investment portfolio.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleRefreshPrices = async () => {
    try {
      setIsRefreshing(true);
      const updated = await investmentService.refreshPrices();
      setPortfolio(updated);
      toast.success('Market quotes updated!');
    } catch (error: any) {
      toast.error('Failed to refresh quotes.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !buyPrice) {
      toast.error('Name, quantity, and buy price are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateInvestmentDTO = {
        name,
        symbol: symbol.trim() || undefined,
        assetClass,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice),
        currentPrice: currentPrice ? Number(currentPrice) : Number(buyPrice),
        purchaseDate,
        recordAsExpense,
        notes: notes.trim() || undefined,
      };

      await investmentService.createInvestment(payload);
      toast.success(`Holding "${name}" added to portfolio!`);
      setIsModalOpen(false);
      resetForm();
      fetchPortfolio();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save investment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSymbol('');
    setAssetClass('stocks');
    setQuantity('');
    setBuyPrice('');
    setCurrentPrice('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setRecordAsExpense(false);
    setNotes('');
  };

  const handleDelete = async (id: string, assetName: string) => {
    if (!window.confirm(`Remove "${assetName}" from your portfolio?`)) return;
    try {
      await investmentService.deleteInvestment(id);
      toast.success(`Removed "${assetName}".`);
      fetchPortfolio();
    } catch (error: any) {
      toast.error('Failed to delete holding.');
    }
  };

  const handleSavePrice = async (id: string) => {
    const newPrice = Number(editingPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid price.');
      return;
    }

    try {
      await investmentService.updateInvestment(id, { currentPrice: newPrice });
      toast.success('Market price updated.');
      setEditingId(null);
      fetchPortfolio();
    } catch (error: any) {
      toast.error('Failed to update price.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-text-muted font-medium tracking-wide">
          Calculating portfolio performance...
        </span>
      </div>
    );
  }

  const summary = portfolio?.summary || {
    totalInvested: 0,
    totalCurrentValue: 0,
    totalGainLoss: 0,
    totalReturnPercentage: 0,
    holdingsCount: 0,
  };

  const allocation = portfolio?.assetAllocation || [];
  const holdings = portfolio?.holdings || [];

  const filteredHoldings = holdings.filter((item) => {
    if (activeTab === 'all') return true;
    return item.assetClass === activeTab;
  });

  const isProfit = summary.totalGainLoss >= 0;

  const chartData = allocation.map((item) => ({
    name: ASSET_LABELS[item.assetClass] || item.assetClass,
    value: item.value,
    color: ASSET_COLORS[item.assetClass] || '#64748B',
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Portfolio</h1>
          <p className="text-text-muted">
            Track stocks, mutual funds, crypto, gold, and fixed deposits with live P&L returns.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefreshPrices}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-custom bg-card-custom hover:bg-border-custom/40 text-text-custom text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh Quotes</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Portfolio Performance KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Current Portfolio Value
          </span>
          <div className="text-2xl font-bold mt-1 text-text-custom">
            ₹{summary.totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-text-muted mt-1">Market valuation</p>
        </div>

        <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Invested Capital
          </span>
          <div className="text-2xl font-bold mt-1 text-text-custom">
            ₹{summary.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-text-muted mt-1">Cost basis across all assets</p>
        </div>

        <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Total Profit / Loss
          </span>
          <div
            className={`text-2xl font-bold mt-1 flex items-center gap-1 ${
              isProfit ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {isProfit ? '+' : '-'}₹{Math.abs(summary.totalGainLoss).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Overall return of{' '}
            <span className={`font-semibold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isProfit ? '+' : ''}
              {summary.totalReturnPercentage}%
            </span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Active Holdings
          </span>
          <div className="text-2xl font-bold mt-1 text-text-custom">
            {summary.holdingsCount} Assets
          </div>
          <p className="text-xs text-text-muted mt-1">
            Across {allocation.length} asset {allocation.length === 1 ? 'class' : 'classes'}
          </p>
        </div>
      </div>

      {/* Asset Allocation Chart & Breakdown */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Allocation Donut Chart */}
          <div className="p-6 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-text-custom mb-1 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-primary" />
                Asset Allocation
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Distribution of current capital across investment classes
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Value']}
                    contentStyle={{
                      backgroundColor: 'var(--card-custom)',
                      borderColor: 'var(--border-custom)',
                      color: 'var(--text-custom)',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Breakdown Cards */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-text-custom mb-1">Allocation Details</h3>
              <p className="text-xs text-text-muted mb-4">
                Real-time valuation and weight of each asset class in your total portfolio
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allocation.map((item) => {
                const color = ASSET_COLORS[item.assetClass] || '#64748B';
                const label = ASSET_LABELS[item.assetClass] || item.assetClass;

                return (
                  <div
                    key={item.assetClass}
                    className="p-3.5 rounded-2xl bg-background-custom/60 border border-border-custom/70 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
                      <div>
                        <div className="text-xs font-semibold text-text-custom">{label}</div>
                        <div className="text-[11px] text-text-muted">
                          ₹{item.value.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-text-custom">{item.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Holdings Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border-custom pb-2 overflow-x-auto">
        {[
          { key: 'all', label: `All Holdings (${holdings.length})` },
          { key: 'stocks', label: 'Stocks' },
          { key: 'mutual_funds', label: 'Mutual Funds' },
          { key: 'crypto', label: 'Crypto' },
          { key: 'gold', label: 'Gold' },
          { key: 'fixed_deposit', label: 'Fixed Deposits' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-custom hover:bg-card-custom'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Holdings Grid */}
      {filteredHoldings.length === 0 ? (
        <div className="border border-border-custom border-dashed rounded-3xl bg-card-custom/50 p-12 text-center flex flex-col items-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-text-custom mb-1">No holdings in this class</h3>
          <p className="text-xs text-text-muted mb-5 leading-relaxed">
            Add your investments in stocks, crypto, mutual funds, or gold to track capital gains and net worth.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all"
          >
            + Add First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHoldings.map((item) => {
            const isItemProfit = item.gainLoss >= 0;
            const assetColor = ASSET_COLORS[item.assetClass] || '#64748B';
            const isEditing = editingId === item._id;

            return (
              <div
                key={item._id}
                className="rounded-3xl border border-border-custom bg-card-custom p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Accent top stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: assetColor }}
                />

                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${assetColor}20`,
                        color: assetColor,
                      }}
                    >
                      {ASSET_LABELS[item.assetClass] || item.assetClass}
                    </span>
                    {item.symbol && (
                      <span className="text-xs font-mono font-semibold text-text-muted">
                        {item.symbol}
                      </span>
                    )}
                  </div>

                  {/* Asset Name */}
                  <h4 className="font-bold text-text-custom text-base truncate mb-1">
                    {item.name}
                  </h4>

                  {/* Current Valuation */}
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-text-custom">
                      ₹{item.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${
                        isItemProfit ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {isItemProfit ? '+' : '-'}₹{Math.abs(item.gainLoss).toLocaleString('en-IN')} (
                      {isItemProfit ? '+' : ''}
                      {item.returnPercentage}%)
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="p-3.5 rounded-2xl bg-background-custom/60 border border-border-custom/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Quantity:</span>
                      <span className="font-semibold text-text-custom">{item.quantity} units</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Avg Buy Price:</span>
                      <span className="font-medium text-text-custom">
                        ₹{item.buyPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Market Price:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            className="w-20 px-2 py-0.5 rounded border border-primary bg-background-custom text-xs"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(item._id)}
                            className="p-1 rounded bg-primary text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-border-custom"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-text-custom">
                            ₹{item.currentPrice.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(item._id);
                              setEditingPrice(String(item.currentPrice));
                            }}
                            className="text-text-muted hover:text-primary transition-colors"
                            title="Edit Current Market Price"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 mt-4 border-t border-border-custom/50 text-[11px] text-text-muted">
                  <span>
                    Purchased:{' '}
                    {new Date(item.purchaseDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={() => handleDelete(item._id, item.name)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Remove asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Asset Modal */}
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
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Add Investment Asset</h3>
                <p className="text-xs text-text-muted">
                  Record new stocks, mutual funds, cryptocurrency, or commodities
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Asset Name & Symbol */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apple Inc, Bitcoin, NIFTY 50"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. AAPL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Asset Class */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                  Asset Class
                </label>
                <select
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="stocks">Stocks & Equities</option>
                  <option value="mutual_funds">Mutual Funds / SIP</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="gold">Gold & Sovereign Bonds</option>
                  <option value="fixed_deposit">Fixed Deposit (FD)</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other Asset</option>
                </select>
              </div>

              {/* Quantity & Buy Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Quantity / Units
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 10 or 0.25"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Buy Price / Unit (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="e.g. 1500"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Current Market Price & Purchase Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Current Market Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    placeholder="Defaults to buy price"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Option to record as cashflow transaction */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-background-custom border border-border-custom">
                <input
                  type="checkbox"
                  id="recordAsExpense"
                  checked={recordAsExpense}
                  onChange={(e) => setRecordAsExpense(e.target.checked)}
                  className="rounded border-border-custom text-primary focus:ring-primary/40 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="recordAsExpense"
                  className="text-xs text-text-custom font-medium cursor-pointer"
                >
                  Record this purchase as an Investment expense in your cashflow ledger
                </label>
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
                      Saving...
                    </>
                  ) : (
                    'Add to Portfolio'
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

export default Investments;
