/**
 * Analytics Client
 * ================
 * A thin HTTP wrapper around the WIMG FastAPI analytics microservice.
 * All ML-related calls from the Node server go through this module.
 *
 * Usage:
 *   import analyticsClient from './analyticsClient';
 *   const result = await analyticsClient.categorize("Swiggy dinner order");
 */

import axios, { AxiosInstance } from 'axios';

// ── Types mirroring FastAPI Pydantic schemas ──────────────────────────────────

export interface CategoryResponse {
  category: string;
  confidence: 'model' | 'rule-based';
}

export interface HistoryPoint {
  ds: string;   // "YYYY-MM-01"
  y: number;
}

export interface ForecastResponse {
  category: string;
  predicted: number;
  lower: number;
  upper: number;
  method: 'prophet' | 'naive';
}

export interface AnomalyResponse {
  is_anomaly: boolean;
  z_score: number;
  threshold: number;
  message: string;
}

export interface HealthScoreRequest {
  monthly_income: number;
  monthly_expenses: number;
  monthly_investment: number;
  monthly_loan_repayment: number;
  savings_balance: number;
  categories_in_budget: number;
  total_budget_categories: number;
}

export interface ComponentScore {
  name: string;
  score: number;
  weight: number;
  weighted: number;
  insight: string;
}

export interface HealthScoreResponse {
  total_score: number;
  band: 'Critical' | 'Needs Attention' | 'Good' | 'Excellent';
  band_color: 'red' | 'yellow' | 'green' | 'emerald';
  components: ComponentScore[];
  summary: string;
}

export interface TransactionRecord {
  description: string;
  amount: number;
  date: string;   // "YYYY-MM-DD"
  category: string;
}

export interface RecurringTransaction {
  description: string;
  amount: number;
  category: string;
  frequency: string;
  mean_interval_days: number;
  last_date: string;
  next_due_date: string;
  occurrences: number;
}

export interface RecurringResponse {
  recurring: RecurringTransaction[];
  count: number;
}

// ── Client class ──────────────────────────────────────────────────────────────

class AnalyticsClient {
  private client: AxiosInstance;
  private isAvailable: boolean = true;

  constructor() {
    const baseURL = process.env.ANALYTICS_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /** Ping the analytics service health endpoint. Returns true if alive. */
  async ping(): Promise<boolean> {
    try {
      await this.client.get('/health');
      this.isAvailable = true;
      return true;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  /** Categorise a single transaction description. */
  async categorize(
    description: string,
    amount?: number
  ): Promise<CategoryResponse | null> {
    try {
      const { data } = await this.client.post<CategoryResponse>('/ml/categorize', {
        description,
        amount,
      });
      return data;
    } catch (err) {
      console.warn('[AnalyticsClient] categorize failed:', err);
      return null;
    }
  }

  /** Forecast next month's spend for a category. */
  async forecast(
    category: string,
    history: HistoryPoint[]
  ): Promise<ForecastResponse | null> {
    try {
      const { data } = await this.client.post<ForecastResponse>('/ml/forecast', {
        category,
        history,
      });
      return data;
    } catch (err) {
      console.warn('[AnalyticsClient] forecast failed:', err);
      return null;
    }
  }

  /** Detect if a transaction amount is unusual for its category. */
  async detectAnomaly(
    amount: number,
    category: string,
    historyAmounts: number[]
  ): Promise<AnomalyResponse | null> {
    try {
      const { data } = await this.client.post<AnomalyResponse>('/ml/anomaly', {
        amount,
        category,
        history_amounts: historyAmounts,
      });
      return data;
    } catch (err) {
      console.warn('[AnalyticsClient] anomaly failed:', err);
      return null;
    }
  }

  /** Compute the composite Financial Health Score. */
  async healthScore(payload: HealthScoreRequest): Promise<HealthScoreResponse | null> {
    try {
      const { data } = await this.client.post<HealthScoreResponse>(
        '/ml/health-score',
        payload
      );
      return data;
    } catch (err) {
      console.warn('[AnalyticsClient] health-score failed:', err);
      return null;
    }
  }

  /** Detect recurring/subscription transactions. */
  async detectRecurring(
    transactions: TransactionRecord[]
  ): Promise<RecurringResponse | null> {
    try {
      const { data } = await this.client.post<RecurringResponse>('/ml/recurring', {
        transactions,
      });
      return data;
    } catch (err) {
      console.warn('[AnalyticsClient] recurring failed:', err);
      return null;
    }
  }
}

// Export a singleton
const analyticsClient = new AnalyticsClient();
export default analyticsClient;
