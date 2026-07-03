import React, { useEffect, useState } from 'react';
import { aiService, type AIInsights as AIInsightsType } from '../services/ai.service';
import { Sparkles, PieChart, TrendingUp, PiggyBank, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<AIInsightsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await aiService.getInsights();
        setInsights(data);
      } catch (error) {
        toast.error('Failed to generate insights. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          AI Insights
        </h1>
        <p className="text-text-muted">
          Personalized analysis and financial suggestions based on your recent activity.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm animate-pulse flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-border-custom/50" />
                <div className="h-4 bg-border-custom/50 rounded w-32" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-border-custom/50 rounded w-full" />
                <div className="h-3 bg-border-custom/50 rounded w-5/6" />
                <div className="h-3 bg-border-custom/50 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      ) : insights ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Analyze Spending */}
          <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col gap-4 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <PieChart className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text-custom">Spending Analysis</h2>
            </div>
            <ul className="text-sm text-text-muted leading-relaxed list-disc pl-5 space-y-1">
              {Array.isArray(insights.analyzeSpending) ? insights.analyzeSpending.map((point, i) => (
                <li key={i}>{point}</li>
              )) : <li>{insights.analyzeSpending}</li>}
            </ul>
          </div>

          {/* Budget Suggestions */}
          <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col gap-4 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text-custom">Budget Suggestions</h2>
            </div>
            <ul className="text-sm text-text-muted leading-relaxed list-disc pl-5 space-y-1">
              {Array.isArray(insights.budgetSuggestions) ? insights.budgetSuggestions.map((point, i) => (
                <li key={i}>{point}</li>
              )) : <li>{insights.budgetSuggestions}</li>}
            </ul>
          </div>

          {/* Expense Trends */}
          <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col gap-4 hover:border-rose-500/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text-custom">Expense Trends</h2>
            </div>
            <ul className="text-sm text-text-muted leading-relaxed list-disc pl-5 space-y-1">
              {Array.isArray(insights.expenseTrends) ? insights.expenseTrends.map((point, i) => (
                <li key={i}>{point}</li>
              )) : <li>{insights.expenseTrends}</li>}
            </ul>
          </div>

          {/* Savings Tips */}
          <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col gap-4 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <PiggyBank className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text-custom">Savings Tips</h2>
            </div>
            <ul className="text-sm text-text-muted leading-relaxed list-disc pl-5 space-y-1">
              {Array.isArray(insights.savingsTips) ? insights.savingsTips.map((point, i) => (
                <li key={i}>{point}</li>
              )) : <li>{insights.savingsTips}</li>}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-card-custom border border-border-custom rounded-2xl text-text-muted">
          No insights available right now. Please check back later.
        </div>
      )}
    </div>
  );
};

export default AIInsights;
