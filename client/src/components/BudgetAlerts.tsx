import React, { useEffect, useState } from 'react';
import { AlertCircle, Wallet, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type Budget, budgetService } from '../services/budget.service';
import { type Goal, goalService } from '../services/goal.service';


export const BudgetAlerts: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [budgetData, goalData] = await Promise.all([
          budgetService.getBudgets(),
          goalService.getGoals()
        ]);
        setBudgets(budgetData.slice(0, 3));
        setGoals(goalData.slice(0, 3));
      } catch (error) {
        console.error('Failed to load dashboard widget data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  return (
    <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col h-full space-y-6">
      
      {/* 1. Budgets Segment */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-text-custom">Active Budgets</h3>
          <Link to="/budgets" className="text-xs font-semibold text-primary hover:underline transition-all">
            Manage
          </Link>
        </div>

        {isLoading ? (
          <div className="py-6 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="py-6 text-center select-none">
            <Wallet className="w-5 h-5 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted font-medium">No budgets set</p>
            <Link to="/budgets" className="text-[10px] text-primary hover:underline mt-1 block">
              Configure now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((b) => {
              const percentage = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
              const isWarning = percentage >= 85;

              return (
                <div key={b._id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-custom">{b.category}</span>
                    <span className={isWarning ? 'text-rose-500 font-bold' : 'text-text-muted'}>
                      ₹{b.spent.toLocaleString()} / ₹{b.limit.toLocaleString()} ({Math.floor(percentage)}%)
                    </span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-border-custom/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isWarning ? 'bg-rose-500 animate-pulse' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {isWarning && (
                    <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1 select-none">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 animate-bounce" />
                      Approaching monthly limit threshold
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Savings Goals Segment */}
      <div className="border-t border-border-custom/50 pt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-text-custom">Savings Goals</h3>
          <Link to="/goals" className="text-xs font-semibold text-primary hover:underline transition-all">
            Manage
          </Link>
        </div>

        {goals.length === 0 ? (
          <div className="py-4 text-center select-none">
            <PiggyBank className="w-5 h-5 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted font-medium">No goals set</p>
            <Link to="/goals" className="text-[10px] text-primary hover:underline mt-1 block">
              Create one now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((g) => {
              const percentage = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
              return (
                <div key={g._id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-custom">{g.title}</span>
                    <span className="text-text-muted">
                      ₹{g.savedAmount.toLocaleString()} / ₹{g.targetAmount.toLocaleString()} ({Math.floor(percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border-custom/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage >= 100 ? 'bg-emerald-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default BudgetAlerts;
