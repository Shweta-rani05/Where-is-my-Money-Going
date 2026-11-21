import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  X,
  Building2,
} from 'lucide-react';
import {
  bankService,
  type BankAccount,
  type SupportedInstitution,
} from '../services/bank.service';
import toast from 'react-hot-toast';

export const Banks: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [institutions, setInstitutions] = useState<SupportedInstitution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Form State
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [accountType, setAccountType] = useState<'checking' | 'savings' | 'credit' | 'investment'>('savings');
  const [initialBalance, setInitialBalance] = useState<string>('50000');
  const [last4, setLast4] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedAccounts, fetchedInstitutions] = await Promise.all([
        bankService.getUserAccounts(),
        bankService.getInstitutions(),
      ]);
      setAccounts(fetchedAccounts);
      setInstitutions(fetchedInstitutions);
      if (fetchedInstitutions.length > 0 && !selectedInstId) {
        setSelectedInstId(fetchedInstitutions[0].id);
      }
    } catch (error: any) {
      toast.error('Failed to load bank accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId) {
      toast.error('Please select an institution.');
      return;
    }

    try {
      setIsConnecting(true);
      const res = await bankService.connectAccount({
        institutionId: selectedInstId,
        accountType,
        initialBalance: Number(initialBalance) || 0,
        accountNumberLast4: last4.trim() || undefined,
      });

      toast.success(
        `Connected ${res.account.institutionName}! Imported ${res.initialSyncResult.importedCount} transactions.`
      );
      setIsConnectModalOpen(false);
      setLast4('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to connect bank account.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async (accountId: string) => {
    try {
      setSyncingAccountId(accountId);
      const res = await bankService.syncAccount(accountId);
      toast.success(
        `Synced with ${res.institutionName}: ${res.importedCount} new transactions (${res.duplicateCount} duplicates skipped).`
      );
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sync failed.');
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleDisconnect = async (accountId: string, bankName: string) => {
    if (!window.confirm(`Are you sure you want to disconnect ${bankName}?`)) {
      return;
    }
    try {
      await bankService.disconnectAccount(accountId);
      toast.success(`Disconnected ${bankName}.`);
      setAccounts((prev) => prev.filter((a) => a._id !== accountId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to disconnect account.');
    }
  };

  const totalBankBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-text-muted font-medium tracking-wide">
          Loading connected bank accounts...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-text-muted">
            Connect your institutions to automatically sync bank feeds, verify balances, and deduplicate expenses.
          </p>
        </div>
        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Bank</span>
        </button>
      </div>

      {/* Security & Total Balance Banner */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-sm md:col-span-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Total Connected Balance
              </span>
              <div className="text-3xl font-bold mt-1 text-text-custom">
                ₹{totalBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-text-muted mt-1">
                Across {accounts.length} active {accounts.length === 1 ? 'account' : 'accounts'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Landmark className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-sm flex items-center gap-3.5">
            <ShieldCheck className="w-7 h-7 text-emerald-500 flex-shrink-0" />
            <div className="text-xs leading-relaxed text-text-muted">
              <strong className="text-emerald-600 block text-sm font-semibold mb-0.5">
                Bank-Grade Encryption
              </strong>
              Direct read-only sync with automated transaction deduplication and zero credentials storage.
            </div>
          </div>
        </div>
      )}

      {/* Accounts List / Grid */}
      {accounts.length === 0 ? (
        <div className="border border-border-custom border-dashed rounded-3xl bg-card-custom/50 p-12 text-center flex flex-col items-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
            <Landmark className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-text-custom mb-2">No bank accounts linked</h3>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">
            Link your bank accounts (HDFC, SBI, ICICI, Axis, Chase, etc.) to automatically fetch transactions, track balances, and categorize your spending with AI.
          </p>
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Connect Your First Bank
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const isSyncing = syncingAccountId === acc._id;
            const inst = institutions.find((i) => i.id === acc.institutionId);
            const brandColor = inst?.color || '#4F46E5';

            return (
              <div
                key={acc._id}
                className="relative overflow-hidden rounded-3xl border border-border-custom bg-card-custom p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
              >
                {/* Top Accent Stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: brandColor }}
                />

                <div>
                  {/* Bank Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ backgroundColor: brandColor }}
                      >
                        {acc.institutionName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-text-custom text-base leading-tight">
                          {acc.institutionName}
                        </h4>
                        <span className="text-xs text-text-muted capitalize">
                          {acc.accountType} Account
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  </div>

                  {/* Account Number & Balance */}
                  <div className="my-5 p-4 rounded-2xl bg-background-custom/60 border border-border-custom/60">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-2 font-mono">
                      <span>Account Number</span>
                      <span>•••• •••• {acc.accountNumberLast4}</span>
                    </div>
                    <div className="text-xs text-text-muted uppercase font-semibold">Balance</div>
                    <div className="text-2xl font-bold text-text-custom tracking-tight">
                      ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="text-[11px] text-text-muted flex items-center justify-between">
                    <span>Last synced:</span>
                    <span className="font-medium text-text-custom">
                      {acc.lastSyncedAt
                        ? new Date(acc.lastSyncedAt).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never'}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-border-custom/50">
                  <button
                    onClick={() => handleSync(acc._id)}
                    disabled={isSyncing}
                    className="flex-1 py-2 px-3 rounded-xl border border-border-custom hover:bg-border-custom/40 text-xs font-semibold text-text-custom flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Feed'}
                  </button>

                  <button
                    onClick={() => handleDisconnect(acc._id, acc.institutionName)}
                    className="p-2 rounded-xl text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Disconnect account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Bank Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 md:p-8 rounded-3xl bg-card-custom shadow-2xl border border-border-custom text-text-custom animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsConnectModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-text-muted hover:text-text-custom hover:bg-border-custom/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Connect Bank Account</h3>
                <p className="text-xs text-text-muted">
                  Select your financial institution to initialize direct read-only sync
                </p>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              {/* Institution Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
                  Select Financial Institution
                </label>
                <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {institutions.map((inst) => {
                    const isSelected = selectedInstId === inst.id;
                    return (
                      <div
                        key={inst.id}
                        onClick={() => setSelectedInstId(inst.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border-custom bg-background-custom/60 hover:border-border-custom/80'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: inst.color }}
                        >
                          {inst.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold truncate text-text-custom">
                          {inst.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Account Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="savings">Savings Account</option>
                    <option value="checking">Checking Account</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                    Starting Balance (₹)
                  </label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="50000"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Optional Last 4 Digits */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                  Account Number Last 4 Digits (Optional)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={last4}
                  onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="Auto-generated if blank (e.g. 4829)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom/50">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-custom hover:bg-border-custom/40 text-text-custom text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Connect & Sync
                    </>
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

export default Banks;

