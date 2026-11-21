import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Sparkles,
  CreditCard,
  Percent,
  Layers,
  Sliders,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  creditScoreService,
  type CreditScoreData,
  type SimulationResult,
} from '../services/creditScore.service';
import toast from 'react-hot-toast';

export const CreditScore: React.FC = () => {
  const [creditData, setCreditData] = useState<CreditScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulator State
  const [simAction, setSimAction] = useState<
    'pay_debt' | 'miss_payment' | 'open_account' | 'increase_limit'
  >('pay_debt');
  const [simValue, setSimValue] = useState<number>(20000);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  const fetchScore = async () => {
    try {
      setIsLoading(true);
      const data = await creditScoreService.getCreditScore();
      setCreditData(data);
    } catch (error: any) {
      toast.error('Failed to load credit score details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const updated = await creditScoreService.recalculateScore();
      setCreditData(updated);
      toast.success('Credit score updated based on latest records!');
    } catch (error: any) {
      toast.error('Failed to refresh score.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSimulate = async () => {
    try {
      const res = await creditScoreService.simulate(simAction, simValue);
      setSimResult(res);
    } catch (error: any) {
      toast.error('Simulation failed.');
    }
  };

  useEffect(() => {
    if (creditData) {
      handleSimulate();
    }
  }, [simAction, simValue, creditData?.score]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-text-muted font-medium tracking-wide">
          Analyzing credit profile and financial indicators...
        </span>
      </div>
    );
  }

  const score = creditData?.score || 750;
  const tier = creditData?.tier || 'Good';
  const factors = creditData?.factors;
  const history = creditData?.scoreHistory || [];
  const recommendations = creditData?.recommendations || [];

  // Tier color styling
  const getTierStyles = (t: string) => {
    switch (t) {
      case 'Excellent':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-500',
          border: 'border-emerald-500/30',
        };
      case 'Good':
        return {
          bg: 'bg-teal-500/10',
          text: 'text-teal-500',
          border: 'border-teal-500/30',
        };
      case 'Fair':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-500',
          border: 'border-amber-500/30',
        };
      default:
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-500',
          border: 'border-rose-500/30',
        };
    }
  };

  const tierStyle = getTierStyles(tier);

  // Format chart dataset
  const historyData = history.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-IN', {
      month: 'short',
      year: '2-digit',
    }),
    score: item.score,
  }));

  // Score percent on 300 - 900 scale
  const gaugePercent = Math.min(100, Math.max(0, ((score - 300) / 600) * 100));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Score Insights</h1>
          <p className="text-text-muted">
            Track credit standing, analyze scoring factors, and simulate financial scenarios.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-custom bg-card-custom hover:bg-border-custom/40 text-text-custom text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          <span>Recalculate Score</span>
        </button>
      </div>

      {/* Main Score Hero Card & History Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Gauge Card */}
        <div className="p-7 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Equifax / CIBIL Standard
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
            >
              {tier}
            </span>
          </div>

          {/* Central Score Display */}
          <div className="my-6">
            <div className="text-6xl font-black tracking-tight text-text-custom mb-1">
              {score}
            </div>
            <div className="text-xs text-text-muted">out of 900</div>
          </div>

          {/* Progress Bar Gauge */}
          <div className="w-full space-y-2 mb-4">
            <div className="w-full h-3 rounded-full bg-background-custom overflow-hidden border border-border-custom relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-700"
                style={{ width: `${gaugePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted font-bold">
              <span>300 (Poor)</span>
              <span>650 (Fair)</span>
              <span>750 (Good)</span>
              <span>900 (Excellent)</span>
            </div>
          </div>

          <div className="text-xs text-text-muted flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Updated from latest banking and cashflow records</span>
          </div>
        </div>

        {/* 6-Month Trajectory Chart */}
        <div className="lg:col-span-2 p-7 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg text-text-custom">Score Trajectory</h3>
              <p className="text-xs text-text-muted">
                Track historical credit improvements over the past 6 months
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Positive Momentum</span>
            </div>
          </div>

          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis
                  domain={[500, 900]}
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} points`, 'Credit Score']}
                  contentStyle={{
                    backgroundColor: 'var(--card-custom)',
                    borderColor: 'var(--border-custom)',
                    color: 'var(--text-custom)',
                    borderRadius: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5 Core Factors Grid */}
      <div>
        <h3 className="font-bold text-xl text-text-custom mb-1">Score Factor Breakdown</h3>
        <p className="text-xs text-text-muted mb-4">
          The 5 core pillars evaluated by credit bureaus to determine your creditworthiness
        </p>

        {factors && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Payment History */}
            <div className="p-5 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-background-custom border border-border-custom text-text-muted">
                    35% Weight
                  </span>
                </div>
                <h4 className="font-bold text-text-custom text-base">Payment History</h4>
                <div className="text-xs font-semibold text-emerald-500 mt-0.5 mb-2">
                  Rating: {factors.paymentHistory.rating}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {factors.paymentHistory.detail}
                </p>
              </div>
            </div>

            {/* Credit Utilization */}
            <div className="p-5 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Percent className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-background-custom border border-border-custom text-text-muted">
                    30% Weight
                  </span>
                </div>
                <h4 className="font-bold text-text-custom text-base">Credit Utilization</h4>
                <div className="text-xs font-semibold text-primary mt-0.5 mb-2">
                  Rating: {factors.creditUtilization.rating}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {factors.creditUtilization.detail}
                </p>
              </div>
            </div>

            {/* Credit Age */}
            <div className="p-5 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-background-custom border border-border-custom text-text-muted">
                    15% Weight
                  </span>
                </div>
                <h4 className="font-bold text-text-custom text-base">Credit History Age</h4>
                <div className="text-xs font-semibold text-purple-500 mt-0.5 mb-2">
                  Rating: {factors.creditAge.rating}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {factors.creditAge.detail}
                </p>
              </div>
            </div>

            {/* Debt to Income */}
            <div className="p-5 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-background-custom border border-border-custom text-text-muted">
                    10% Weight
                  </span>
                </div>
                <h4 className="font-bold text-text-custom text-base">Debt-to-Income (DTI)</h4>
                <div className="text-xs font-semibold text-teal-500 mt-0.5 mb-2">
                  Rating: {factors.debtToIncome.rating}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {factors.debtToIncome.detail}
                </p>
              </div>
            </div>

            {/* Credit Mix */}
            <div className="p-5 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-background-custom border border-border-custom text-text-muted">
                    10% Weight
                  </span>
                </div>
                <h4 className="font-bold text-text-custom text-base">Credit Mix</h4>
                <div className="text-xs font-semibold text-amber-500 mt-0.5 mb-2">
                  Rating: {factors.creditMix.rating}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{factors.creditMix.detail}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simulator & AI Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* "What-If" Credit Simulator */}
        <div className="p-7 rounded-3xl bg-card-custom border border-border-custom shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg text-text-custom">What-If Score Simulator</h3>
          </div>
          <p className="text-xs text-text-muted mb-6">
            Simulate how financial actions impact your credit score before taking them
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                Select Action to Simulate
              </label>
              <select
                value={simAction}
                onChange={(e) => setSimAction(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="pay_debt">Pay Down Credit Card Debt</option>
                <option value="increase_limit">Request Higher Credit Limit</option>
                <option value="open_account">Open New Credit Card / Account</option>
                <option value="miss_payment">Miss a Scheduled Payment</option>
              </select>
            </div>

            {(simAction === 'pay_debt' || simAction === 'increase_limit') && (
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={simValue}
                  onChange={(e) => setSimValue(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-custom bg-background-custom text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}

            {/* Simulation Impact Banner */}
            {simResult && (
              <div className="mt-6 p-4 rounded-2xl bg-background-custom/70 border border-border-custom space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted font-medium">Estimated Impact</span>
                  <span
                    className={`text-sm font-bold flex items-center gap-1 ${
                      simResult.delta >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {simResult.delta >= 0 ? `+${simResult.delta}` : simResult.delta} points
                  </span>
                </div>

                <div className="flex items-center justify-between text-base">
                  <span className="text-text-muted text-xs">Simulated Score</span>
                  <span className="font-extrabold text-xl text-text-custom">
                    {simResult.simulatedScore}{' '}
                    <span className="text-xs font-normal text-text-muted">
                      ({simResult.simulatedTier})
                    </span>
                  </span>
                </div>

                <p className="text-xs text-text-muted leading-relaxed pt-2 border-t border-border-custom/40">
                  {simResult.explanation}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Action Plan Recommendations */}
        <div className="p-7 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-lg text-text-custom">Personalized Credit Tips</h3>
            </div>
            <p className="text-xs text-text-muted mb-6">
              Data-backed recommendations based on your current accounts and spending habits
            </p>

            <div className="space-y-3.5">
              {recommendations.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-background-custom/60 border border-border-custom flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-text-custom leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border-custom/50 text-[11px] text-text-muted flex items-center gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              Credit scores refresh automatically with new monthly statements and bill payments.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditScore;
