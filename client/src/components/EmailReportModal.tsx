import React, { useState } from 'react';
import { Mail, Send, Eye, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportService, type MonthlyReportData } from '../services/report.service';
import toast from 'react-hot-toast';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailReportModal: React.FC<EmailReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [isSending, setIsSending] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<MonthlyReportData | null>(null);

  if (!isOpen) return null;

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [
    currentDate.getFullYear(),
    currentDate.getFullYear() - 1,
    currentDate.getFullYear() - 2,
  ];

  const handleSend = async () => {
    try {
      setIsSending(true);
      const res = await reportService.sendEmailReport({
        month: selectedMonth,
        year: selectedYear,
      });

      if (res.data?.simulated) {
        toast.success(`[Dev Mode] Report generated for ${res.data.recipient}! (Add RESEND_API_KEY in .env for live dispatch)`);
      } else {
        toast.success(`Report dispatched to ${res.data.recipient}! Check your inbox.`);
      }
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send email report.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      const res = await reportService.getReportPreview({
        month: selectedMonth,
        year: selectedYear,
      });
      setPreviewData(res.data.reportData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch report preview.');
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl p-6 md:p-8 rounded-3xl bg-card-custom shadow-2xl border border-border-custom text-text-custom animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-text-muted hover:text-text-custom hover:bg-border-custom/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Email Expense Report</h2>
            <p className="text-xs text-text-muted">
              Sends an interactive, AI-enhanced breakdown directly to your inbox
            </p>
          </div>
        </div>

        {/* Destination Information */}
        <div className="p-3.5 rounded-xl bg-background-custom/60 border border-border-custom text-xs mb-5 flex items-center justify-between">
          <span className="text-text-muted">Recipient Address:</span>
          <span className="font-semibold text-text-custom">{user?.email}</span>
        </div>

        {/* Period Selector */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setPreviewData(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setPreviewData(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Preview Card (if loaded) */}
        {previewData && (
          <div className="mb-6 p-4 rounded-2xl border border-border-custom bg-background-custom/40 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Preview: {previewData.period.monthName} {previewData.period.year}
              </span>
              <span className="text-xs text-text-muted">
                {previewData.metrics.transactionCount} transactions
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] text-emerald-600 font-bold uppercase">Income</div>
                <div className="text-sm font-bold text-emerald-500">
                  ₹{previewData.metrics.totalIncome.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="text-[10px] text-rose-600 font-bold uppercase">Expenses</div>
                <div className="text-sm font-bold text-rose-500">
                  ₹{previewData.metrics.totalExpense.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-[10px] text-blue-600 font-bold uppercase">Net Savings</div>
                <div className="text-sm font-bold text-blue-500">
                  ₹{previewData.metrics.netSavings.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Takeaway */}
            <div className="text-xs text-text-muted p-2.5 rounded-lg bg-card-custom border border-border-custom/50">
              💡 {previewData.keyTakeaway}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-border-custom/50">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing || isSending}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border-custom hover:bg-border-custom/40 text-text-custom text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Preview Summary
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Report Now
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmailReportModal;
